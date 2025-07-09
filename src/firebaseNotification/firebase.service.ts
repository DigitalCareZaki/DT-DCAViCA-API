import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from 'src/prisma/prisma.service';
import { Cron } from '@nestjs/schedule';

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

    constructor(private readonly prisma: PrismaService) { }

    @Cron('* * * * *', {
        name: 'MedicationReminders',
        timeZone: 'UTC',
    })
    handleCron() {
        (async () => {
            await this.sendMedicationReminders();
        })();
    }
    async sendMedicationReminders() {
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

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

            await this.sendNotification(
                alert.medication.doctor.user_id,
                alert.medication.patient.user_id,
                'Medication Reminder',
                `Hello, ${name}, have you taken your medicine? (Medicine ID: ${alert.medication.id})`
            );


            await this.prisma.patientMedicationAlerts.update({
                where: { id: alert.id },
                data: { notification_sent: true },
            });
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
            if (!user || !user.device_token) {
                console.log('User not found or device token not found');
                return;
            }
            const token = user.device_token;

            const message = {
                notification: {
                    title,
                    body,
                },
                token,
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
}