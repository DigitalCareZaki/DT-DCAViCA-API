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
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { AddVideosDTO } from './dto/add.dto';
import { GetUser } from 'src/auth/decorators';
import { UserRes } from '@types';
import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { RolesGuard } from 'src/auth/guards';
import { Role } from 'src/auth/enums/role.enum';
import { MeasurementType } from '@prisma/client';

@Controller('web/videos')
export class WebVideosController extends VideosController {
  constructor(videosService: VideosService) {
    super(videosService);
  }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  public async getVideos(@GetUser() user: UserRes, @Query('category') category?: string) {
    return this.getVideosService().getVideos(user.organization_id, category);
  }

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @RequirePermission(Role.ADMIN, Role.SUPERADMIN)
  public async addVideos(@Body() body: AddVideosDTO, @GetUser() user: UserRes) {
    return this.getVideosService().addVideo(body, user.id);
  }
}
