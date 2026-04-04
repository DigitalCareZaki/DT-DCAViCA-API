import { Injectable } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { AdminService } from 'src/admin/admin.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(role: any, search: string, branchId: string): Promise<Partial<User>[]> {
        try {
            return this.prisma.user.findMany({
                where: {
                    AND: [
                        {
                            associated_branches: {
                                some: {
                                    id: branchId,  // 🔥 Only users from this branch
                                },
                            },
                        },
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
        } catch (error) {
            throw error;
        }

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

    async findAllUsers(role: string, search: string): Promise<Partial<User>[]> {
        let result: Partial<User>[] = [];
        let searchRoleCondition = {};

        switch (role) {
            case Role.DOCTOR:
                // doctor can see admin and nurse
                searchRoleCondition = {
                    OR: [
                        { role: Role.ADMIN },
                        { role: Role.NURSE },
                    ],
                };

                break;

            case Role.PATIENT:
                // patient can see only nurse
                searchRoleCondition = {
                    OR: [
                        { role: Role.NURSE },
                    ],
                };

                break;

            case Role.NURSE:
                // nurse can see admin, patient, and doctor
                searchRoleCondition = {
                    OR: [
                        { role: Role.ADMIN },
                        { role: Role.DOCTOR },
                        { role: Role.PATIENT },
                    ],
                };

                break;

            case Role.ADMIN:
                // admin can see all users except patient
                searchRoleCondition = {
                    NOT: {
                        role: Role.PATIENT,
                    },
                };

                break;

            case Role.SUPERADMIN:
                // superadmin can see all users except patient
                searchRoleCondition = {
                    NOT: {
                        role: Role.PATIENT,
                    },
                };

                break;

            default:
                throw new Error('Invalid role provided');
        }

        return await this.prisma.user.findMany({
            where: {
                AND: [
                    searchRoleCondition,
                    {
                        OR: [
                            { first_name: { contains: search, mode: 'insensitive' } },
                            { last_name: { contains: search, mode: 'insensitive' } },
                            { middle_name: { contains: search, mode: 'insensitive' } },
                            { email: { contains: search, mode: 'insensitive' } },
                            { username: { contains: search, mode: 'insensitive' } },
                        ]
                    }
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
            },
            orderBy: {
                first_name: 'asc',
            },
        });
    }

    async checkUsername(username: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                username: {
                    equals: username,
                    mode: 'insensitive',
                }
            }
        });

        if (user) {
            return {
                exists: true,
                message: "Username already exists, choose other username.",
            };
        }

        return {
            exists: false,
            message: "Username is available.",
        };
    }
}
