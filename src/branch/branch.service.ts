import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import type { GetBranchesProsp } from './types';
import { AddBranchDTO } from './dto/addBranch.dto';

@Injectable()
export class BranchService {
  constructor(private prisma: PrismaService) {}

  public async getBranches(
    organizationId: string,
    search: string,
  ): Promise<GetBranchesProsp[]> {
    return await this.prisma.branch.findMany({
      where: {
        AND: [
          {
            organization_id: organizationId,
          },
          {
            OR: [
              {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  equals: search,
                },
              },
              {
                phone_number: {
                  equals: search,
                },
              },
              {
                location: {
                  address: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone_number: true,
        location: {
          select: {
            address: true,
            city: {
              select: {
                name: true,
                country: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        created_by: true,
        created_at: true,
      },
    });
  }

  public async addBranch(
    organizationId: string,
    createdBy: string,
    locationId: string,
    data: AddBranchDTO,
  ): Promise<boolean> {
    await this.prisma.branch.create({
      data: {
        name: data.name,
        email: data.email,
        phone_number: data.phoneNumber,
        location: {
          connect: {
            id: locationId,
          },
        },
        orgnatization: {
          connect: {
            id: organizationId,
          },
        },
        created_by: createdBy,
      },
    });

    return true;
  }
}
