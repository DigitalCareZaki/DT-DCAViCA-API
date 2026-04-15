import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from 'src/prisma/prisma.service';
import { Cron } from '@nestjs/schedule';
import { SendgridService } from 'src/sendGrid/sendgrid.service';
import { TwilioService } from 'src/twilio/twilio.service';
import { SENDGRID_TEMPLATES } from 'src/constant';
import { SendMailPayload } from '@types';

@Injectable()
export class FirebaseService implements OnModuleInit {

    private firebaseApp: admin.app.App;

    onModuleInit() {
        if (!admin.apps.length) {
            try {
                this.firebaseApp = admin.initializeApp({
                    credential: admin.credential.cert(JSON.parse(
                        process.env.FIREBASE_SERVICE_ACCOUNT_JSON as string,
                    ) as admin.ServiceAccount),
                });

                console.log('Firebase Admin Initialized');
            } catch (error) {
                console.error('Firebase Admin Initialization Error', error.stack);
            }
        } else {
            this.firebaseApp = admin.apps[0];
            console.log('Firebase Admin App already initialized');
        }
    }

    constructor(private readonly prisma: PrismaService, private mail: SendgridService, private sms: TwilioService) { }

    @Cron('* * * * *', {
        name: 'MedicationReminders',
        timeZone: 'UTC',
    })
    handleCron() {
        (async () => {
            await this.sendMedicationReminders();
            await this.patientAppointmentAlert();
        })();
    }
    async sendMedicationReminders() {
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        console.log(fiveMinutesAgo, 'fiveMinutesAgo')
        // await this.prisma.patientMedicationAlerts.updateMany({
        //     where: {
        //         alert_time: {
        //             lte: now,
        //         },
        //         taken: 'PENDING',
        //         notification_sent: true,
        //     },
        //     data: {
        //         taken: 'MISSED',
        //     },
        // });
        const alerts = await this.prisma.patientMedicationAlerts.findMany({
            where: {
                alert_time: {
                    lte: fiveMinutesAgo,
                },
                taken: 'PENDING',
                notification_sent: false,
            },
            include: {
                medication: {
                    select: {
                        name: true,
                        id: true,
                        doctor_id: true,
                        dosage: true,
                        patient: {
                            select: {
                                user_id: true,
                                user: {
                                    select: {
                                        first_name: true,
                                        device_token: true,
                                        phone_number: true,
                                    },
                                },
                            },
                        },
                        doctor: {
                            select: {
                                user_id: true,

                            },
                        },
                    },
                },
            },
        });
        console.log('Alerts found for reminders:', alerts.length);
        console.log('Alerts found for reminders:', alerts);
        for (const alert of alerts) {
            const patientUser = alert.medication.patient.user;
            const patientId = alert.medication.patient.user_id;
            const name = patientUser?.first_name || 'Patient';

            await this.prisma.patientMedicationAlerts.update({
                where: { id: alert.id },
                data: { notification_sent: true },
            });

            await this.sendNotification(
                alert.medication.doctor.user_id,
                alert.medication.patient.user_id,
                'Medication Reminder',
                `Hello, ${name}, have you taken your medicine? (Medicine Name: ${alert.medication.name}), Medicine Dosage: ${alert.medication.dosage}`,
            );
        }


    }



    public async sendNotification(sender: string, receiver: string, title: string, body: string) {
        console.log('Sending notification:', { sender, receiver, title, body });
        try {
            await this.prisma.notification.create({
                data: {
                    sender_id: sender,
                    reciever_id: receiver,
                    title,
                    description: body,
                },
            });
            console.log('Notification saved to database');

            const user = await this.prisma.user.findUnique({
                where: {
                    id: receiver,
                },
                select: {
                    device_token: true,
                },
            });
            console.log(user, 'Fetched user for notification');
            if (!user || !user.device_token) {
                console.log('User not found or device token not found');
                return;
            }
            console.log(user, 'User found!');
            const token = user.device_token;

            const message = {
                notification: {
                    title,
                    body,
                },
                token
                // token: 'cIOt-g6YPkn5n0kT4xqi25:APA91bHrFH8ebsH9opPUapJHRof7vf04cqDBQG8whZgeNs6h9chZz1WMywmNfLHGVvhGmVwqWlOIJgQJ_ZRzfio5SfAbSc0Wr1gYhRAOMzYd7yDpkH3swuY'
            };
            console.log(message, '=============>message')
            const response = await this.firebaseApp.messaging().send(message);
            console.log('Notification sent:', response);
            return response;
        } catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    }



    async patientAppointmentAlert() {
        console.log('Appointment Alert Cron Job Running...>>>>>>');

        const now = new Date();
        const next30Minutes = new Date(now.getTime() + 30 * 60 * 1000);

        const appointments = await this.prisma.appointment.findMany({
            where: {
                status: 'ACTIVE',
                start_date: {
                    gte: now,
                    lte: next30Minutes,
                },
                // participants: {
                //     some: {
                //         user: {
                //             role: 'PATIENT',
                //         },
                //     },
                // },
            },
            select: {
                id: true,
                start_date: true,
                end_date: true,
                participants: {
                    where: {
                        notification_sent: false,
                        // user: {
                        //     role: 'PATIENT',
                        // },
                    },
                    select: {
                        id: true,
                        status: true,
                        user: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                email: true,
                                role: true,
                                device_token: true,
                                phone_number: true,
                            },
                        },
                    },
                },
            },
        });

        console.log('Upcoming Appointments: ', appointments);

        for (const appointment of appointments) {
            for (const participant of appointment.participants) {
                console.log(participant, 'Participant in appointment');
                const patientUser = participant.user;
                const name = patientUser?.first_name || 'Participant';

                // update notification flag
                await this.prisma.appointmentParticipants.update({
                    where: { id: participant.id }, // use participant id
                    data: { notification_sent: true },
                });

                // send notification
                await this.sendNotification(
                    patientUser.id,
                    patientUser.id,
                    'Appointment Reminder',
                    `Hello ${name}, your appointment will start in 30 minutes.`,
                );

                await this.sms.sendSMS(
                    patientUser.phone_number,
                    `Hello ${name}, your appointment will start in 30 minutes.`
                );

                await this.prisma.sms.create({
                    data: {
                        receiver_id: patientUser.id,
                        sender_id: patientUser.id,
                        to: patientUser.phone_number,
                        body: "your appointment will start in 30 minutes",
                    },
                });

                const mailPayload = {
                    to: [patientUser.email],
                    data: {
                        subject: 'Appointment Reminder',
                        message: `your appointment will start in 30 minutes.`,
                    },
                    templateId: SENDGRID_TEMPLATES.APPOINTMENT_REMINDER,
                } satisfies SendMailPayload;

                await this.mail.sendSgMail(mailPayload);


            }
        }
    }

}