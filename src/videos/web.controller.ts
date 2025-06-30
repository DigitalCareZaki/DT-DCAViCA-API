import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { VideosService } from './videos.service';
import { AddVideosDTO } from './dto/add.dto';
import { GetUser } from 'src/auth/decorators';
import { UserRes } from '@types';
import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { JwtGuard, RolesGuard } from 'src/auth/guards';
import { Role } from 'src/auth/enums/role.enum';

@UseGuards(JwtGuard)
@Controller('web/videos')
export class WebVideosController {
  constructor(private readonly videosService: VideosService) { }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  public async getVideos(@GetUser() user: UserRes, @Query('category') category?: string) {
    return this.videosService.getLatestVideo(user.organization_id, category);
  }
  @Get('/all-videos')
  @HttpCode(HttpStatus.OK)
  public async getAllVideos(@GetUser() user: UserRes, @Query('category') category?: string) {
    return this.videosService.getAllVideos(user.organization_id, category);
  }

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @RequirePermission(Role.ADMIN, Role.SUPERADMIN)
  public async addVideos(@Body() body: AddVideosDTO, @GetUser() user: UserRes) {
    return this.videosService.addVideo(body, user.id);
  }
}
