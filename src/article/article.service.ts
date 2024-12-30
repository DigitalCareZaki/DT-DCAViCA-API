import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ArticleService {
  constructor(private prisma: PrismaService) {}

  public async getArticles(): Promise<any> {
    return await this.prisma.post.findMany({
      where: {
        active: true,
      },
      include: {
        author: {
          select: {
            first_name: true,
            last_name: true,
            middle_name: true,
            uri: true,
            role: true,
            doctor: {
              select: {
                specialities: {
                  orderBy: {
                    created_at: 'desc',
                  },
                  take: 1,
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
        },
      },

      orderBy: {
        created_at: 'desc',
      },
    });
  }
}
