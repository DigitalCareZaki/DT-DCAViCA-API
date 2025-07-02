import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from 'src/prisma/prisma.service';
import { Cron } from '@nestjs/schedule';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
    private firebaseApp: admin.app.App;

    onModuleInit() {
        if (!admin.apps.length) {
            try {
                this.firebaseApp = admin.initializeApp({
                    credential: admin.credential.cert(path.resolve('./firebase-service-account.json') as admin.ServiceAccount),
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

    @Cron('0 1 * * *', {
        name: 'MedicationReminders',
        timeZone: 'UTC',
    })
    handleCron() {
        (async () => {
            await this.sendMedicationReminders();
        })();
    }

    public async sendMedicationReminders() {
        console.log('Running Medication Reminders Cron Job');
        const now = new Date();
        const medications = await this.prisma.medication.findMany({
            where: {
                start_date: { lte: now },
                end_date: { gte: now },
            },
            select: {
                id: true,
                patient_id: true,
                doctor_id: true,
                time: true,
                start_date: true,
                end_date: true,
                name: true,
                dosage: true,
                frequency: true,
                unit: true,
                patient: {
                    select: {
                        user_id: true,
                        user: {
                            select: {
                                email: true,
                                first_name: true,
                                phone_number: true,
                                device_token: true,
                            },
                        },
                    },
                },
            }
        });
        console.log('Medications found for reminders:', medications.length);
        for (const medication of medications) {
            const now = new Date();
            const medTime = new Date(now);
            medTime.setUTCHours(medication.time.getUTCHours(), medication.time.getUTCMinutes(), medication.time.getUTCSeconds(), 0);

            const notificationTime = new Date(medTime.getTime() + 30 * 60 * 1000); // 30 minutes after medication time
            // const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
            // console.log(`Medication Scheduled Time (Today): ${medTime.toISOString()}`);
            // console.log(`Notification Time: ${notificationTime.toISOString()}`);
            // console.log(`Now: ${now.toISOString()}`);
            //console.log(`Thirty Minutes Ago: ${thirtyMinutesAgo.toISOString()}`);

            if (now.getUTCHours() === notificationTime.getUTCHours() &&
                now.getUTCMinutes() === notificationTime.getUTCMinutes()) {
                console.log('alert set ==============>', medication);
                //Send notification
                await this.sendNotification(
                    medication.doctor_id,
                    medication.patient.user_id,
                    'Medication Reminder',
                    `Hello, ${medication.patient?.user?.first_name}, have you taken your medicine? (Medicine ID: ${medication.id})`
                );
            }

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