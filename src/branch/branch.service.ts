import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import type { GetBranchDetailsProps, GetBranchesProsp } from './types';
import { AddBranchDTO } from './dto/addBranch.dto';

@Injectable()
export class BranchService {
  constructor(private prisma: PrismaService) { }

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
        orgnatization: {
          select: {
            name: true
          },
        },
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

  public async getBranchDetails(
    organizationId: string,
    branchId: string,
  ): Promise<GetBranchDetailsProps> {
    const branch = await this.prisma.branch.findFirst({
      where: {
        id: branchId,
        organization_id: organizationId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone_number: true,
        organization_id: true,
        location: {
          select: {
            id: true,
            address: true,
            city: {
              select: {
                id: true,
                name: true,
                country: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        created_by: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return branch;
  }
}
