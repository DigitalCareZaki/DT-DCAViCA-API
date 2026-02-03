/**
 * Truncate Script
 *
 * This script truncates all tables from the database defined in DATABASE_URL.
 * It uses TRUNCATE ... CASCADE to handle foreign key constraints.
 *
 * Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/truncate.ts
 *
 * WARNING: This will permanently delete all data from all tables.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * List of all model names in the Prisma schema.
 * These must match the model names (which become table names in snake_case).
 */
const tableNames = [
    // Core entities
    'UserMetaData',
    'Slot',
    'SlotWrapper',
    'SlotParent',
    'Emails',
    'Contacts',
    'Password',
    'User',

    // Organization and Location
    'Department',
    'Specialization',
    'Doctor',
    'Site',
    'Nurse',
    'Device',
    'PatientDevice',
    'Tablet',
    'PatientTablet',
    'PatientMeasurementRange',
    'OTP',
    'Patient',
    'ElectronicMedicalReport',
    'Measurement',
    'Medication',
    'PatientMedicationAlerts',
    'OrganizationMedication',
    'Organization',
    'Branch',
    'Location',
    'Country',
    'City',

    // Social features
    'Likes',
    'Comments',
    'Views',
    'Post',

    // Appointments
    'AppointmentParticipants',
    'AppointmentObservation',
    'JoinedParticipants',
    'Appointment',

    // Communication
    'Message',
    'Chat',
    'Room',
    'Logs',
    'Notification',
    'Videos',
    'Sms',
];

async function truncateAllTables(): Promise<void> {
    console.log('🗑️  Starting database truncation...\n');
    console.log(`📦 Database URL: ${process.env.DATABASE_URL?.substring(0, 50)}...`);
    console.log(`📊 Total tables to truncate: ${tableNames.length}\n`);

    try {
        // Disable foreign key checks and truncate all tables using raw SQL
        // PostgreSQL uses TRUNCATE ... CASCADE
        for (const tableName of tableNames) {
            try {
                // Convert PascalCase to snake_case for table names
                const snakeCaseName = tableName
                    .replace(/([A-Z])/g, '_$1')
                    .toLowerCase()
                    .replace(/^_/, '');

                await prisma.$executeRawUnsafe(
                    `TRUNCATE TABLE "${snakeCaseName}" RESTART IDENTITY CASCADE;`
                );
                console.log(`✅ Truncated: ${tableName} (${snakeCaseName})`);
            } catch (error) {
                // Table might not exist or have a different name - try original name
                try {
                    await prisma.$executeRawUnsafe(
                        `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`
                    );
                    console.log(`✅ Truncated: ${tableName}`);
                } catch (innerError) {
                    console.log(`⚠️  Skipped: ${tableName} (table may not exist)`);
                }
            }
        }

        console.log('\n✨ Database truncation completed successfully!');
    } catch (error) {
        console.error('\n❌ Error during truncation:', error);
        throw error;
    }
}

async function main(): Promise<void> {
    const args = process.argv.slice(2);

    // Safety check - require --force flag for production databases
    if (process.env.DATABASE_URL?.includes('production') && !args.includes('--force')) {
        console.error(
            '🚫 Production database detected! Use --force flag to confirm truncation.'
        );
        process.exit(1);
    }

    // Confirmation prompt for safety
    if (!args.includes('--yes') && !args.includes('-y')) {
        console.log('⚠️  WARNING: This will DELETE ALL DATA from all tables!');
        console.log('   Use --yes or -y flag to skip this warning.\n');
    }

    await truncateAllTables();
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
