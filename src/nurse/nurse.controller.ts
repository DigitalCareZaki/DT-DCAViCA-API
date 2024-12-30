import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { NurseService } from './nurse.service';
import { JwtGuard, RolesGuard } from 'src/auth/guards';
import { GetUser } from 'src/auth/decorators';
import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/auth/enums/role.enum';

import type { ProfileRes, CurrentRes } from './types';
import type { UserRes } from '@types';
import { DoctorProfileUpdateDto } from 'src/doctor/dto';

@Controller()
@UseGuards(JwtGuard, RolesGuard)
@RequirePermission(Role.NURSE)
export class NurseController {
  constructor(private nurseService: NurseService) {}

  @HttpCode(HttpStatus.OK)
  @Get('profile')
  public async profile(@GetUser() user: UserRes): Promise<ProfileRes> {
    return await this.nurseService.profile(user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('current')
  public async current(@GetUser() user: UserRes): Promise<CurrentRes> {
    return this.nurseService.current(user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('patients')
  public async patients(@GetUser() user: UserRes): Promise<any> {
    return await this.nurseService.patients(user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('profile')
  public async updateProfile(
    @GetUser() user: UserRes,
    @Body() data: DoctorProfileUpdateDto,
  ): Promise<any> {
    return this.nurseService.updateProfile(user.id, data);
  }

  public getNurseService(): NurseService {
    return this.nurseService;
  }
}
