import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RolePlatform } from '@prisma/client';

@Injectable()
export class LogsListener {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) { }

  @OnEvent('create_log')
  public async handleCreateLogEvent(payload: any) {
    try {
      let user_id: string | undefined | null = null;
      if (payload.token) {
        const token = payload.token.split('Bearer ').at(-1);
        const decodedToken = this.jwtService.verify(token);
        user_id = decodedToken?.id as string;
      }

      if (!user_id) {
        console.warn('Log skipped: user_id missing');
        return;
      }
      if (payload.platform == "VL") {
        payload.platform = RolePlatform.WEB;
      }
      await this.prisma.logs.create({
        data: {
          user_id: user_id,
          method: payload.method ?? 'unknown',
          endpoint: payload.endpoint ?? 'unknown',
          platform: payload.platform ?? RolePlatform.WEB,
          module: payload.module ?? 'default',
        },
      });

      console.log('NEW LOG CREATED: ', new Date());
    } catch (err) {
      console.log('Logs listener error', JSON.stringify(err));
    }
  }
}
