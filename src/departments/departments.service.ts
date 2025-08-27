import { Injectable } from '@nestjs/common';
import { UserRes } from '@types';
import { PrismaService } from 'src/prisma/prisma.service';
import { DepartmentProps } from './types';
import { DepartmentDTO } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) { }

  public async getDepartments(
    user: UserRes,
    search: string,
  ): Promise<DepartmentProps[]> {
    if (user.role === 'ADMIN') return this.getAdminDepartments(user.id, search);
    return this.getSuperAdminDepartments(user.id, search);
  }

  public async createDepartment(data: DepartmentDTO) {
    const location = await this.prisma.location.create({
      data: {
        city_id: data.city_id,
        address: data.address,
        zipcode: data.zipcode,
      },
    });

    return await this.prisma.department.create({
      data: {
        title: data.title,
        description: data.description,
        location_id: location.id,
        barnch_id: data.branch_id,
      },
    });
  }

  public async updateDepartment(
    departmentId: string,
    data: DepartmentDTO,
  ) {
    // check if user can edit the department
    console.log(data, 'departmentId ===========>>>');

    try {
      const canEditDepartment = await this.prisma.department.findFirst({
        where: {
          id: departmentId,
        },
        select: {
          id: true,
        },
      });

      if (!canEditDepartment) {
        throw new Error('Can not edit department');
      }

      // check if department does not already exists
      const departmentAlreadyExists = await this.prisma.department.findFirst({
        where: {
          title: data.title,
        },
        select: {
          id: true,
        },
      });

      if (departmentAlreadyExists && departmentAlreadyExists.id !== departmentId) {
        throw new Error('Department already exists');
      }

      const location = await this.prisma.location.create({
        data: {
          city_id: data.city_id,
          address: data.address,
          zipcode: data.zipcode,
        },
      });

      const department = await this.prisma.department.update({
        where: {
          id: departmentId,
        },
        data: {
          title: data.title,
          description: data.description,
          location_id: location.id,
          barnch_id: data.branch_id,
        },
        select: {
          id: true,
          title: true,
          description: true,
          location: {
            select: {
              address: true,
              zipcode: true,
              city: {
                select: {
                  name: true,
                  id: true,
                },
              },
            },
          },
          branch: {
            select: {
              name: true,
              id: true,
            },
          },


          created_at: true,
          updated_at: true,
        },
      });

      return department;
    }
    catch (error) {
      console.error(error);
      throw new Error('Failed to update department');
    }
  }

  public async getBranches(user: UserRes) {
    if (user.role === 'ADMIN') return this.getAdminBranch(user.id);
    if (user.role === 'SUPERADMIN') return this.getSuperAdminBranches(user.id);
  }

  public async getCities() {
    return await this.prisma.city.findMany({
      select: {
        name: true,
        id: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  private async getAdminBranch(userId: string) {
    const data = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
      select: {
        associated_branches: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return data.associated_branches;
  }

  private async getSuperAdminBranches(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
      select: {
        organization_id: true,
      },
    });

    return await this.prisma.branch.findMany({
      where: {
        organization_id: user.organization_id,
      },

      select: {
        id: true,
        name: true,
      },
    });
  }

  public async getSingleDepartment(
    departmentId: string,
  ) {
    console.log(departmentId, 'departmentId ===========>>>');
    return await this.prisma.department.findUniqueOrThrow({
      where: {
        id: departmentId,

      },
      select: {
        id: true,
        title: true,
        description: true,
        location: {
          select: {
            zipcode: true,
            address: true,
            city: {
              select: {
                name: true,
                id: true,
              },
            },
          },
        },
        branch: {
          select: {
            name: true,
            id: true,
          },
        },


        created_at: true,
        updated_at: true,
      },
    });

  }

  private async getSuperAdminDepartments(
    userId: string,
    search: string,
  ): Promise<DepartmentProps[]> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
      select: {
        organization_id: true,
      },
    });

    return await this.prisma.department.findMany({
      where: {
        branch: {
          organization_id: user.organization_id,
        },
        OR: [
          {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      },

      select: {
        id: true,
        title: true,
        description: true,
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
        branch: {
          select: {
            name: true,
          },
        },
        doctor: {
          select: {
            id: true,
          },
        },
        nurse: {
          select: {
            id: true,
          },
        },
        created_at: true,
      },

      orderBy: {
        created_at: 'desc',
      },
    });
  }

  private async getAdminDepartments(
    userId: string,
    search: string,
  ): Promise<DepartmentProps[]> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: userId,
      },

      select: {
        associated_branches: {
          select: {
            id: true,
          },
        },
      },
    });

    return await this.prisma.department.findMany({
      where: {
        barnch_id: user.associated_branches[0].id,
        OR: [
          {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      },

      select: {
        id: true,
        title: true,
        description: true,
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
        branch: {
          select: {
            name: true,
          },
        },
        doctor: {
          select: {
            id: true,
          },
        },
        nurse: {
          select: {
            id: true,
          },
        },
        created_at: true,
      },

      orderBy: {
        created_at: 'desc',
      },
    });
  }
}
