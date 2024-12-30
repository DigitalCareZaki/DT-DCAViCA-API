import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { SuperadminController } from './superadmin.controller';
import { SuperadminService } from './superadmin.service';
import { GetUser } from 'src/auth/decorators';

import type { StatsProps } from './types';
import type { UserRes } from '@types';
import { BranchService } from 'src/branch/branch.service';
import { GetBranchesProsp } from 'src/branch/types';
import { AddBranchDTO } from 'src/branch/dto/addBranch.dto';
import { LocationService } from 'src/location/location.service';
import { DoctorProfileUpdateDto } from 'src/doctor/dto';

@Controller('web/superadmin')
export class SuperAdminWebController extends SuperadminController {
  constructor(
    superAdminService: SuperadminService,
    branchService: BranchService,
    locationService: LocationService,
  ) {
    super(superAdminService, branchService, locationService);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/stats')
  public async getStats(@GetUser() user: UserRes): Promise<StatsProps> {
    const organizationId = await this.getSuperAdminService().getOrganizationId(
      user.id,
    );

    return this.getSuperAdminService().getStats(organizationId);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/branches')
  public async getBranches(
    @GetUser() user: UserRes,
    @Query('search') search: string,
  ): Promise<GetBranchesProsp[]> {
    const organizationId = await this.getSuperAdminService().getOrganizationId(
      user.id,
    );

    return this.getBranchService().getBranches(organizationId, search);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('branches')
  public async addBranch(
    @GetUser() user: UserRes,
    @Body() data: AddBranchDTO,
  ): Promise<boolean> {
    const organizationId = await this.getSuperAdminService().getOrganizationId(
      user.id,
    );

    const city = await this.getLocationService().getCityById(data.city);

    if (!city) {
      throw new Error('Not a valid city');
    }

    const country = await this.getLocationService().getCountryById(
      data.country,
    );

    if (!country) {
      throw new Error('Not a valid country');
    }

    const locationId = await this.getLocationService().createLocation(
      data.address,
      city.id,
    );

    return this.getBranchService().addBranch(
      organizationId,
      this.getName(user.first_name, user.middle_name, user.last_name),
      locationId,
      data,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('profile')
  public async profile(@GetUser() user: UserRes) {
    return await this.getSuperAdminService().profile(user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('profile')
  public async updateProfile(
    @GetUser() user: UserRes,
    @Body() data: DoctorProfileUpdateDto,
  ): Promise<any> {
    return this.getSuperAdminService().updateProfile(user.id, data);
  }

  private getName(
    firstName: string,
    middleName: string,
    lastName: string,
  ): string {
    const name = [];

    if (firstName) name.push(name);
    if (middleName) name.push(middleName);
    if (lastName) name.push(lastName);

    return name.join(' ');
  }
}
