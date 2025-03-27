import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as serviceAccount from '../../serviceAccountKey.json';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class FirebaseService {
    private firebaseApp: admin.app.App;

    constructor(private prisma: PrismaService) {
        this.firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        });
    }

    @Cron('0 0 * * *', {
        name: 'MedicationReminders',
        timeZone: 'UTC',
    })
    handleCron() {
        (async () => {
            await this.sendMedicationReminders();
        })();
    }

    private async sendMedicationReminders() {
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

    public async sendNotification(token: string, title: string, body: string) {
        if (!token) {
            console.error('No FCM token found');
            return;
        }
        try {
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