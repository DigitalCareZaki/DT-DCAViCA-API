import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { subscribe } from 'diagnostics_channel';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(role: any, search: string): Promise<Partial<User>[]> {
        return this.prisma.user.findMany({
            where: {
                AND: [
                    { role },
                    {
                        OR: [
                            { first_name: { contains: search, mode: 'insensitive' } },
                            { last_name: { contains: search, mode: 'insensitive' } },
                            { middle_name: { contains: search, mode: 'insensitive' } },
                            { email: { contains: search, mode: 'insensitive' } },
                            { username: { contains: search, mode: 'insensitive' } },
                        ],
                    },
                ],
            },
            select: {
                id: true,
                email: true,
                first_name: true,
                middle_name: true,
                last_name: true,
                dob: true,
                uri: true,
                username: true,
                role: true,
                created_at: true,
                doctor: {
                    select: {
                        id: true,
                        specialities: true,
                    }
                },
                organization: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
            },
            orderBy: [
                {
                    first_name: 'asc',
                },
                {
                    id: 'asc', // fallback ordering when first_name is null
                }
            ],
        });
    }

    async getProfile(id: string) {
        const user = await this.prisma.user.findUniqueOrThrow({
            where: {
                id,
            },
            select: {
                id: true,
                first_name: true,
                middle_name: true,
                last_name: true,
                dob: true,
                uri: true,
                role: true,
                gender: true,
                title: true,
                email: true,
                phone_number: true,
                username: true,
                pincode: true,
                location: {
                    include: {
                        city: {
                            include: {
                                country: true,
                            },
                        },
                    },
                },
                patient: {
                    select: {
                        emr: true,
                        weight: true,
                        height: true,
                    }
                },
                doctor: {
                    include: {
                        specialities: true,
                        departments: true,
                    },
                },
                created_at: true,
                updated_at: true,
                active: true,
            },
        });

        // Adding static values for language and timezone
        return {
            ...user,
            language: "English",
            timeZone: "UTC+5",
            SSN: "123-45-6789", // Example static value for SSN
            subscribeId: "13127386184", // Example static value for subscribeId
            measurementSystem: "Standard", // Example static value for MeasurementSystem
        };
    }

}
