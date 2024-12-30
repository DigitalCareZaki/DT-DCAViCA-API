import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddVideosDTO } from './dto/add.dto';

@Injectable()
export class VideosService {
  constructor(private prisma: PrismaService) {}

  public async getVideos() {}

  public async addVideo(data: AddVideosDTO, userId: string) {
    return await this.prisma.videosMetaData.create({
      data: {
        title: data.title,
        description: data.description,
        thumbnail: data.thumbnail,
        uri: data.uri,
        author_id: userId,
      },
    });
  }
}
