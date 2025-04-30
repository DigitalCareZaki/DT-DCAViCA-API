import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import { MasterController } from './master.controller';
import { MasterService } from './master.service';
import { UserRes } from '@types';
import { GetUser } from 'src/auth/decorators';
import { DoctorProfileUpdateDto } from 'src/doctor/dto';
import { AddOrganizationDTO } from './dto/addOrganization.dto';
import { ToggleEmailTemplate } from './dto/toggleEmailTemplate.dto';

@Controller('web/master')
export class WebMasterController extends MasterController {
  constructor(masterService: MasterService) {
    super(masterService);
  }

  @Get('/statistics')
  @HttpCode(HttpStatus.OK)
  public async getStatistics() {
    return this.getMasterService().getStatistics();
  }

  @HttpCode(HttpStatus.OK)
  @Get('/organizations')
  public async getOrganizations() {
    return this.getMasterService().getOrganizations();
  }

  @HttpCode(HttpStatus.OK)
  @Get('/get-organizations')
  public async getSelectOrganization() {
    return this.getMasterService().getSelectOrganization();
  }

  @HttpCode(HttpStatus.OK)
  @Get('profile')
  public async profile(@GetUser() user: UserRes) {
    return await this.getMasterService().profile(user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('profile')
  public async updateProfile(
    @GetUser() user: UserRes,
    @Body() data: DoctorProfileUpdateDto,
  ): Promise<any> {
    return this.getMasterService().updateProfile(user.id, data);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/organizations')
  public async createOrganization(@Body() data: AddOrganizationDTO) {
    return this.getMasterService().createOrganization(data);
  }

  @HttpCode(HttpStatus.OK)
  @Get('cities')
  public async getCities() {
    return this.getMasterService().getCities();
  }

  @HttpCode(HttpStatus.OK)
  @Get('/superadmins')
  public async getSuperadmins() {
    return this.getMasterService().getSuperadmins();
  }

  @HttpCode(HttpStatus.OK)
  @Get('/email-templates')
  public async getEmailTemplates() {
    return this.getMasterService().getEmailTemplates();
  }

  @HttpCode(HttpStatus.OK)
  @Get('/branches')
  public async getBranches() {
    return this.getMasterService().getBranches();
  }

  @HttpCode(HttpStatus.OK)
  @Patch('/toggle-email-template')
  public async toggleEmailTemplate(@Body() data: ToggleEmailTemplate) {
    return this.getMasterService().toggleEmailTemplate(data);
  }
}
