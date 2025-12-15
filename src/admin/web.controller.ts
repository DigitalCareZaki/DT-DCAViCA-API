import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { GetUser } from 'src/auth/decorators';
import { UserRes } from '@types';
import { PatientProfile } from 'src/nurse/types';
import { DoctorProfileUpdateDto } from 'src/doctor/dto';

@Controller('web/admin')
export class WebAdminController extends AdminController {
  constructor(adminService: AdminService) {
    super(adminService);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/patient')
  public async getPatient(@Query('search') search: string, @Query('page') page = 1, @Query('limit') limit = 10, @GetUser() user: UserRes) {
    console.log('search query:', search);
    return this.getAdminService().getPatients(search, user, +page, +limit);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/patients/profile/:id')
  public async patientProfile(
    @GetUser() user: UserRes,
    @Param('id') id: string,
  ): Promise<PatientProfile> {
    return this.getAdminService().getPatientProfile(id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/stats')
  public async getStats(@GetUser() user: UserRes) {
    const branch = await this.getAdminService().getBranchId(user.id);

    return await this.getAdminService().getStats(branch.id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('profile')
  public async profile(@GetUser() user: UserRes) {
    return await this.getAdminService().profile(user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('profile')
  public async updateProfile(
    @GetUser() user: UserRes,
    @Body() data: DoctorProfileUpdateDto,
  ): Promise<any> {
    return this.getAdminService().updateProfile(user.id, data);
  }
}
