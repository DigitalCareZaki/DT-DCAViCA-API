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
import { AdminService } from 'src/admin/admin.service';
import { AddSuperadminVideosDTO } from './dto/video.dto';

@UseGuards(JwtGuard)
@Controller('web/videos')
export class WebVideosController {
  constructor(private readonly videosService: VideosService,
    private readonly adminService: AdminService
  ) { }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  public async getVideos(@GetUser() user: UserRes, @Query('category') category?: string) {
    return this.videosService.getLatestVideo(user.organization_id, category);
  }
  @Get('/all-videos')
  @HttpCode(HttpStatus.OK)
  public async getAllVideos(@GetUser() user: UserRes, @Query('category') category?: string) {
    let branchId: any;
    if (user.role === Role.ADMIN) {
      branchId = await this.adminService.getBranchId(user.id);
    }
    const targetId =
      user.role === Role.SUPERADMIN ? user.organization_id : branchId.id;
    console.log('targetId', targetId);
    return this.videosService.getAllVideos(targetId, user.role, category);
  }

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @RequirePermission(Role.ADMIN)
  public async addVideos(@Body() body: AddVideosDTO, @GetUser() user: UserRes) {
    const branchId = await this.adminService.getBranchId(user.id);
    console.log(branchId.id);
    return this.videosService.addVideo(body, user.id, branchId.id);
  }
  @Post('/video-superadmin')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @RequirePermission(Role.SUPERADMIN)
  public async addSuperadminVideos(@Body() body: AddSuperadminVideosDTO, @GetUser() user: UserRes) {
    return this.videosService.addSuperadminVideos(body, user.id);
  }
}
