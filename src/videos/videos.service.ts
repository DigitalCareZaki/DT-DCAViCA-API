import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { AddVideosDTO } from './dto/add.dto';

import type { VideoPriority, VideoCategory, MeasurementType } from '@prisma/client';
import { Role } from 'src/auth/enums/role.enum';
import { AddSuperadminVideosDTO } from './dto/video.dto';

@Injectable()
export class VideosService {
  constructor(private prisma: PrismaService) { }

  public async getAllVideos(id: string, role: string, category?: string) {
    try {
      const isSuperAdmin = role === Role.SUPERADMIN;
      const whereCondition: any = isSuperAdmin
        ? { author: { organization_id: id } }
        : { branchId: id };
      if (category) {
        whereCondition.category = category as MeasurementType;
      }
      return await this.prisma.videos.findMany({
        where: whereCondition,
        select: {
          title: true,
          description: true,
          uri: true,
          category: true,
          priority: true,
          author: {
            select: {
              first_name: true,
              middle_name: true,
              last_name: true,
              email: true,
            },
          },
          branch: {
            select: {
              name: true,
              location: true,
            },
          },
          created_at: true,
        },
        orderBy: {
          created_at: 'desc', // Most recent video first
        },
      });

    } catch (error) {
      console.log('Error fetching all videos:', error);
      throw new Error('Could not fetch videos');
    }


  }
  public async getLatestVideo(organizationId: string, category?: string) {
    return await this.prisma.videos.findFirst({
      where: {
        author: {
          organization_id: organizationId,
        },
        ...(category ? { category: category as MeasurementType } : {}),
      },
      select: {
        title: true,
        description: true,
        uri: true,
        category: true,
        priority: true,
        author: {
          select: {
            first_name: true,
            middle_name: true,
            last_name: true,
            email: true,
          },
        },
        created_at: true,
      },
      orderBy: {
        created_at: 'desc', // Most recent video first
      },
    });
  }
  public async addVideo(data: AddVideosDTO, userId: string, branchId: string) {

    try {
      const video = await this.prisma.videos.create({
        data: {
          title: data.title,
          description: data.description,
          uri: data.uri,
          priority: data.priority as VideoPriority,
          category: data.category as MeasurementType,
          author: {
            connect: {
              id: userId,
            },
          },
          branch: {
            connect: {
              id: branchId,
            },
          },
        },
      });
      return video;

    } catch (error) {
      console.log('error', error);
    }

  }
  public async addSuperadminVideos(data: AddSuperadminVideosDTO, userId: string) {

    try {
      const video = await this.prisma.videos.create({
        data: {
          title: data.title,
          description: data.description,
          uri: data.uri,
          priority: data.priority as VideoPriority,
          category: data.category as MeasurementType,
          author: {
            connect: {
              id: userId,
            },
          },
          branch: {
            connect: {
              id: data.branch_id,
            },
          },
        },
      });
      return video;

    } catch (error) {
      console.log('error', error);
    }

  }
}
