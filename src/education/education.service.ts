import { Injectable, HttpStatus } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { JsonRes, UserRes } from '@types';
import type { PostRes, Post } from './types';

import { PostDTO } from './dto';

import { AppError } from 'src/errors';
import { Role } from 'src/auth/enums/role.enum';

@Injectable()
export class EducationService {
  constructor(private prisma: PrismaService) { }

  public async getPosts(page: number, limit: number): Promise<PostRes[]> {
    return await this.prisma.post.findMany({
      where: { active: true },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        uri: true,
        title: true,
        content: true,
        author: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
        likes_count: true,
        views_count: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  public async createPost(authorId: string, data: PostDTO): Promise<Post> {
    return await this.prisma.post.create({
      data: {
        ...data,
        author_id: authorId,
      },
    });
  }

  public async likePost(postId: string, userId: string): Promise<JsonRes> {
    const post = await this.prisma.post.findFirst({
      where: {
        AND: [
          {
            AND: [
              {
                id: postId,
              },
              {
                active: true,
              },
            ],
          },
          {
            NOT: {
              likes: {
                some: {
                  user_id: userId,
                },
              },
            },
          },
        ],
      },

      select: {
        id: true,
      },
    });

    if (!post) {
      throw new AppError('Post is already liked by you', HttpStatus.CONFLICT);
    }

    await this.prisma.post.update({
      where: {
        id: post.id,
      },
      data: {
        likes_count: {
          increment: 1,
        },
        views_count: {
          increment: 1,
        },
        likes: {
          create: {
            user_id: userId,
          },
        },
        views: {
          create: {
            user_id: userId,
          },
        },
      },
    });

    return {
      status: 'success',
      message: 'Post successfully liked',
    };
  }

  public async viewPost(postId: string, userId: string): Promise<void> {
    const isViewedBefore = await this.prisma.post.findFirst({
      where: {
        AND: [
          {
            AND: [
              {
                id: postId,
              },
              {
                active: true,
              },
            ],
          },
          {
            views: {
              some: {
                user_id: userId,
              },
            },
          },
        ],
      },
    });

    if (isViewedBefore) return;

    await this.prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        views_count: {
          increment: 1,
        },
        views: {
          create: {
            user_id: userId,
          },
        },
      },
    });
  }

  public async getIndividualPost(postId: string) {
    try {
      const post = await this.prisma.post.findFirst({
        where: {
          AND: [
            { id: postId },
            { active: true },
          ],
        },
        select: {
          id: true,
        },
      });

      if (!post) {
        throw new AppError("Post not found", 404);
      }

      console.log('Individual Post >>>>', post);
      return post;
    } catch (error) {
      console.log('Error in getIndividualPost >>>>', error);
      throw error;
    }
  }

  public async getTrendingPosts(branchId: string, value: string): Promise<PostRes[]> {

    console.log(value, '=====>>value')

    const whereCondition: any = value ? {
      active: true,
      author: {
        associated_branches: {
          some: {
            id: branchId,
          },
        },
      },
      OR: [
        {
          title: {
            contains: value,
            mode: 'insensitive',
          },
        },
        {
          content: {
            contains: value,
            mode: 'insensitive',
          },
        },
        {
          author: {
            email: value,
          },
        },
        {
          author: {
            OR: [
              {
                first_name: {
                  contains: value,
                  mode: 'insensitive',
                },
              },
              {
                last_name: {
                  contains: value,
                  mode: 'insensitive',
                },
              },
              {
                middle_name: {
                  contains: value,
                  mode: 'insensitive',
                },
              },
            ],
          },
        },
      ],
    } : {
      active: true,
      author: {
        associated_branches: {
          some: {
            id: branchId,
          },
        },
      }
    };
    return await this.prisma.post.findMany({
      where: whereCondition,
      select: {
        id: true,
        uri: true,
        title: true,
        content: true,
        author: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
        likes_count: true,
        views_count: true,
        created_at: true,
      },
      orderBy: {
        views_count: 'desc',
      },
    });
  }

  public async getMyPosts(user: UserRes): Promise<PostRes[]> {
    if (user.role === 'NURSE' || user.role === 'PATIENT') {
      return this.prisma.post.findMany({
        where: {
          AND: [
            {
              likes: {
                some: {
                  user_id: user.id,
                },
              },
            },
            {
              active: true,
            },
          ],
        },
        select: {
          id: true,
          uri: true,
          title: true,
          content: true,
          author: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
          likes_count: true,
          views_count: true,
          created_at: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    }

    return this.prisma.post.findMany({
      where: {
        AND: [
          {
            author_id: user.id,
          },
          {
            active: true,
          },
        ],
      },
      select: {
        id: true,
        uri: true,
        title: true,
        content: true,
        author: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
        likes_count: true,
        views_count: true,
        created_at: true,
      },
    });
  }

  public async search(value: string, branchId: string): Promise<PostRes[]> {
    return await this.prisma.post.findMany({
      where: {
        active: true,
        author: {
          associated_branches: {
            some: {
              id: branchId,
            },
          },
        },
        OR: [
          {
            title: {
              contains: value,
            },
          },
          {
            content: {
              contains: value,
            },
          },
          {
            author: {
              email: value,
            },
          },
          {
            author: {
              OR: [
                {
                  first_name: {
                    contains: value,
                    mode: 'insensitive',
                  },
                },
                {
                  last_name: {
                    contains: value,
                    mode: 'insensitive',
                  },
                },
                {
                  middle_name: {
                    contains: value,
                    mode: 'insensitive',
                  },
                },
              ],
            },
          },
        ],
      },
      select: {
        id: true,
        uri: true,
        title: true,
        content: true,
        author: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
        likes_count: true,
        views_count: true,
        created_at: true,
      },
    });
  }

  public async getPostDetail(id: string): Promise<any> {
    return this.prisma.post.findFirstOrThrow({
      where: {
        AND: [
          {
            id,
          },
          { active: true },
        ],
      },

      select: {
        id: true,
        uri: true,
        title: true,
        content: true,
        author: {
          select: {
            first_name: true,
            last_name: true,
            uri: true,
            middle_name: true,
            role: true,
            email: true,
          },
        },
        likes_count: true,
        views_count: true,
        created_at: true,
        additional_uri: true,
        refrence: true,
      },
    });
  }

  public async deletePost(userId: string, postId: string) {
    await this.prisma.post.findFirstOrThrow({
      where: {
        AND: [
          {
            id: postId,
          },
          {
            author_id: userId,
          },
        ],
      },
    });

    return await this.prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        active: false,
      },
    });
  }
}
