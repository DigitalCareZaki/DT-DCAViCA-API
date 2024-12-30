import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LogsListener } from './logs.listener';
import { LogsMiddleware } from 'src/middlewares/logs.middleware';
import { LogsService } from './logs.service';
import { LogsController } from './logs.controller';
import { WebLogsController } from './web.controller';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: async () => {
        return {
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: process.env.JWT_EXPIRESIN },
        };
      },
    }),
    // PrismaModule,
  ],
  controllers: [LogsController, WebLogsController],
  providers: [LogsListener, LogsMiddleware, LogsService],
  exports: [LogsMiddleware],
})
export class LogsModule {}
