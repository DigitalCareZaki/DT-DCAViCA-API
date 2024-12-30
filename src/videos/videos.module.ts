import { Module } from '@nestjs/common';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { WebVideosController } from './web.controller';

@Module({
  controllers: [VideosController, WebVideosController],
  providers: [VideosService],
})
export class VideosModule {}
