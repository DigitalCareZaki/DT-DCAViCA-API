import { Injectable } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(role: any): Promise<Partial<User>[]> {
        return this.prisma.user.findMany({
            where: { role },
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
        });
    }
}
