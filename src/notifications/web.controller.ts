import { Body, Controller, Get, HttpCode, HttpStatus, Param, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { GetUser } from 'src/auth/decorators';
import { UserRes } from '@types';
import { JwtGuard } from 'src/auth/guards';
import { AdminService } from 'src/admin/admin.service';
import { Role } from '@prisma/client';

@Controller('web/notifications')
export class NotificationsWebController {
  constructor(private readonly notificationService: NotificationsService, private readonly adminService: AdminService) { }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  @Get('/')
  public async getNotifications(@Query('page') page = 1, @Query('limit') limit = 10, @GetUser() user: UserRes) {
    console.log('user ====>>', user);
    let branchId: any;
    if (user.role === Role.ADMIN || user.role === Role.DOCTOR) {
      branchId = await this.adminService.getBranchId(user.id);
    }
    const targetId =
      user.role === Role.SUPERADMIN ? user.organization_id : branchId.id;
    console.log('targetId', targetId);
    return this.notificationService.getNotifications(user, targetId, +page, +limit);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/:patient_id')
  public async fetchPatientNotifications(@Query('page') page = 1, @Query('limit') limit = 10, @Param('patient_id') patient_id: string) {
    return this.notificationService.getPatientNotifications(patient_id, +page, +limit);
  }
}
