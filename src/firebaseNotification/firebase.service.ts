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
        console.log('Running Medication Reminders Cron Job');
        const now = new Date();
        // Calculate the time 30 minutes ago
        const thirteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
        // Find medications where the time is 30 minutes ago
        const medications = await this.prisma.medication.findMany({
            where: {
                start_date: { lte: now },
                end_date: { gte: now },
                time: {
                    gte: thirteenMinutesAgo,
                    lte: now,
                },
            },
            select: {
                id: true,
                patient_id: true,
                doctor_id: true,
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
                                phone_number: true,
                                device_token: true,
                            },
                        },
                    },
                },
            }
        });

        // Send notifications
        if (medications.length === 0) {
            console.log('No medications found for reminders');
            return;
        }
        for (const medication of medications) {

            console.log(medication, '=============>medication')
            await this.sendNotification(
                medication.doctor_id,
                medication.patient.user_id,
                'Medication Reminder',
                `Hello, ${medication.patient?.user?.first_name} have you taken your medicine.`
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