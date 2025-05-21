import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import type { InboxRes, Message, SearchUserRes } from './types';
import { ComposeDTO } from './dto/compose.dto';

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) { }

  public async inbox(userId: string, search: string): Promise<InboxRes[]> {
    return this.prisma.message.findMany({
      where: {
        parent_id: null,
        AND: [
          {
            reciever_id: userId,
          },
          {
            deleted: false,
          },
          {
            OR: [
              {
                subject: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                content: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                sender: {
                  OR: [
                    {
                      first_name: {
                        contains: search,
                        mode: 'insensitive',
                      },
                    },
                    {
                      last_name: {
                        contains: search,
                        mode: 'insensitive',
                      },
                    },
                    {
                      middle_name: {
                        contains: search,
                        mode: 'insensitive',
                      },
                    },
                    {
                      email: {
                        contains: search,
                      },
                    },
                    {
                      username: {
                        contains: search,
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      },

      select: {
        id: true,
        subject: true,
        content: true,
        sender: {
          select: {
            first_name: true,
            last_name: true,
            middle_name: true,
            uri: true,
            email: true,
          },
        },
        attachments: true,
        created_at: true,
        deleted: true,
        starred: true,
      },

      orderBy: {
        created_at: 'desc',
      },
    });
  }

  public async compose(userId: string, data: ComposeDTO): Promise<Message> {
    const reciever = await this.prisma.user.findUniqueOrThrow({
      where: {
        email: data.send_to,
      },
      select: {
        id: true,
      },
    });

    return this.prisma.message.create({
      data: {
        sender_id: userId,
        attachments: data.attachments ?? [],
        subject: data.subject,
        content: data.content,
        reciever_id: reciever.id,
        parent_id: data.parent_id ?? null,
      },
    });
  }

  public async deleteMessage(
    userId: string,
    messageId: string,
  ): Promise<boolean> {
    await this.prisma.message.findFirstOrThrow({
      where: {
        AND: [
          {
            id: messageId,
          },
          {
            reciever_id: userId,
          },
          {
            deleted: false,
          },
        ],
      },
    });

    await this.prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        deleted: true,
      },
    });

    return true;
  }

  public async unstarredMessage(userId: string, messageId: string) {
    await this.prisma.message.findFirstOrThrow({
      where: {
        AND: [
          {
            id: messageId,
          },
          {
            reciever_id: userId,
          },
          {
            starred: true,
          },
        ],
      },

      select: {
        id: true,
      },
    });

    await this.prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        starred: false,
      },
    });

    return true;
  }

  public async starredMessage(
    userId: string,
    messageId: string,
  ): Promise<boolean> {
    await this.prisma.message.findFirstOrThrow({
      where: {
        AND: [
          {
            id: messageId,
          },
          {
            reciever_id: userId,
          },
          {
            starred: false,
          },
        ],
      },
      select: {
        id: true,
      },
    });

    await this.prisma.message.update({
      where: {
        id: messageId,
      },

      data: {
        starred: true,
      },
    });

    return true;
  }

  public async getSentMessages(
    userId: string,
    search: string,
  ): Promise<InboxRes[]> {
    console.log('search: ', search);
    const res = await this.prisma.message.findMany({
      where: {
        sender_id: userId,
        OR: [
          {
            subject: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            content: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            reciever: {
              OR: [
                {
                  first_name: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  last_name: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  middle_name: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  email: {
                    contains: search,
                  },
                },
                {
                  username: {
                    contains: search,
                  },
                },
              ],
            },
          },
        ],
      },

      select: {
        id: true,
        subject: true,
        content: true,
        sender: {
          select: {
            first_name: true,
            last_name: true,
            middle_name: true,
            uri: true,
            email: true,
          },
        },
        reciever: {
          select: {
            first_name: true,
            last_name: true,
            middle_name: true,
            uri: true,
            email: true,
          },
        },
        attachments: true,
        created_at: true,
        deleted: true,
        starred: true,
      },

      orderBy: {
        created_at: 'desc',
      },
    });

    return res.map((message) => ({
      ...message,
      sender: {
        ...message.reciever,
      },
    }));
  }

  public async getStarredMessages(
    userId: string,
    search: string,
  ): Promise<InboxRes[]> {
    return this.prisma.message.findMany({
      where: {
        AND: [
          {
            reciever_id: userId,
          },
          {
            starred: true,
          },
          {
            deleted: false,
          },
          {
            OR: [
              {
                subject: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                content: {
                  contains: search,
                  mode: 'insensitive',
                },
              },

              {
                sender: {
                  OR: [
                    {
                      first_name: {
                        contains: search,
                        mode: 'insensitive',
                      },
                    },
                    {
                      last_name: {
                        contains: search,
                        mode: 'insensitive',
                      },
                    },
                    {
                      middle_name: {
                        contains: search,
                        mode: 'insensitive',
                      },
                    },
                    {
                      email: {
                        contains: search,
                      },
                    },
                    {
                      username: {
                        contains: search,
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      },

      select: {
        id: true,
        subject: true,
        content: true,
        sender: {
          select: {
            first_name: true,
            last_name: true,
            middle_name: true,
            uri: true,
            email: true,
          },
        },
        attachments: true,
        created_at: true,
        deleted: true,
        starred: true,
      },

      orderBy: {
        created_at: 'desc',
      },
    });
  }

  public async searchUsers(value: string): Promise<SearchUserRes[]> {
    return this.prisma.user.findMany({
      where: {
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
          {
            email: {
              contains: value,
            },
          },
          {
            username: {
              contains: value,
            },
          },
        ],
      },

      select: {
        email: true,
        uri: true,
        role: true,
        first_name: true,
        last_name: true,
        middle_name: true,
      },
    });
  }

  public async getThreadByParent(messageId: string) {
    const thread = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: true, // Include sender of the root message
        replies: {
          include: {
            sender: true, // Include sender of the first-level replies
            replies: {
              include: {
                sender: true, // Include sender of the second-level replies
                replies: {
                  include: {
                    sender: true, // Include sender of the third-level replies
                    replies: {
                      include: {
                        sender: true, // You can keep going deeper if needed
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Recursive function to flatten replies
    const flattenReplies = (message: any): any[] => {
      let result: any[] = [message]; // include the current message
      if (message.replies && message.replies.length > 0) {
        for (const reply of message.replies) {
          result = result.concat(flattenReplies(reply));
        }
      }
      return result;
    };

    const flatThread = flattenReplies(thread);


    const uniqueRepliesMap = new Map();
    flatThread.forEach(msg => uniqueRepliesMap.set(msg.id, msg));
    const uniqueReplies = Array.from(uniqueRepliesMap.values());

    // Sort by creation time if needed
    uniqueReplies.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return uniqueReplies;
  }

  public async getUserMessages(userId: string) {
    return await this.prisma.message.findMany({
      where: {
        parent_id: null, // Root messages only
        OR: [
          { reciever_id: userId },
        ],
      },
      include: {
        replies: true, // Optionally eager-load direct replies
      },
      orderBy: {
        updated_at: 'desc',
      },
    });
  }


}
