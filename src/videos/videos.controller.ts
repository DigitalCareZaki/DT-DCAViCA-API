import { Controller, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards';
import { VideosService } from './videos.service';

@Controller()
@UseGuards(JwtGuard)
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  public getVideosService(): VideosService {
    return this.videosService;
  }
}
