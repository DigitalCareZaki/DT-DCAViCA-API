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
        }
    }

    constructor(private readonly prisma: PrismaService) { }

    @Cron('0 0 * * *', {
        name: 'MedicationReminders',
        timeZone: 'UTC',
    })
    handleCron() {
        (async () => {
            await this.sendMedicationReminders();
        })();
    }

    public async sendMedicationReminders() {
        const now = new Date();
        const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000); // Current time + 15 min

        // Find medications where the time is  15 minutes ago
        const medications = await this.prisma.medication.findMany({
            where: {
                start_date: { lte: now },
                end_date: { gte: now },
                time: {
                    gte: fifteenMinutesLater,
                    lte: now,
                },
            },
            select: {
                id: true,
                patient_id: true,
                time: true,
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
                                phone_number: true
                                // fcm_token: true,
                            },
                        },
                    },
                },
            }
        });

        // Send notifications
        for (const medication of medications) {

            console.log(medication, '=============>medication')
            // await this.sendNotification(
            //     medication.user.fcm_token,
            //     'Medication Reminder',
            //     `Hello, ${medication.patient?.user?.first_name} have you taken your medicine.`
            // );
        }
    }

    public async sendNotification(sender: string, receiver: string, title: string, body: string) {
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

            const response = await this.firebaseApp.messaging().send(message);
            console.log('Notification sent:', response);
            return response;
        } catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    }
}