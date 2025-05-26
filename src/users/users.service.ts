import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
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
}
