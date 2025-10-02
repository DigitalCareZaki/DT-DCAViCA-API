import { Module } from '@nestjs/common';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { WebVideosController } from './web.controller';
import { AdminService } from 'src/admin/admin.service';

@Module({
  controllers: [VideosController, WebVideosController],
  providers: [VideosService, AdminService],
})
export class VideosModule { }
