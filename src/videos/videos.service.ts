import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { AddVideosDTO } from './dto/add.dto';

import type { VideoPriority, VideoCategory } from '@prisma/client';

@Injectable()
export class VideosService {
  constructor(private prisma: PrismaService) {}

  public async getVideos(organizationId: string) {
    return await this.prisma.videos.findMany({
      where: {
        author: {
          organization_id: organizationId,
        },
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
    });
  }

  public async addVideo(data: AddVideosDTO, userId: string) {
    return await this.prisma.videos.create({
      data: {
        title: data.title,
        description: data.description,
        uri: data.uri,
        priority: data.priority as VideoPriority,
        category: data.category as VideoCategory,
        author: {
          connect: {
            id: userId,
          },
        },
      },
    });
  }
}
