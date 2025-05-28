import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { MeasurementService } from './measurement.service';

import { JwtGuard, RolesGuard } from 'src/auth/guards';
import { Role } from 'src/auth/enums/role.enum';
import { RequirePermission } from 'src/auth/decorators/role.decorator';

import { GetUser } from 'src/auth/decorators';

import { MeasurementDTO } from './dto';

import { PaginatedResult, UserRes } from '@types';
import type { ModifiedMeasurement } from './types';

@Controller('web/measurements')
@UseGuards(JwtGuard, RolesGuard)
@RequirePermission(Role.DOCTOR, Role.NURSE, Role.PATIENT)
export class MeasurementWebController {
  constructor(private readonly measurementService: MeasurementService) {}

  @HttpCode(HttpStatus.OK)
  @Get('')
  @UseGuards(RolesGuard)
  @RequirePermission(Role.DOCTOR, Role.NURSE)
  public async getAllPatientMeasurements(
    @GetUser() user: UserRes,
    @Query('type') type?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<PaginatedResult<ModifiedMeasurement>> {
    return this.measurementService.getMeasurementsOfAllPatients(
      user.id,
      user.role,
      type || '',
      page || 1,
      limit || 10,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('latestReadings')
  @UseGuards(RolesGuard)
  @RequirePermission(Role.DOCTOR, Role.NURSE)
  public async getPatientListWithLatestReadings(
    @GetUser() user: UserRes,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<PaginatedResult<ModifiedMeasurement>> {
    return this.measurementService.getPatientListWithLatestReadings(
      user.id,
      user.role,
      page || 1,
      limit || 10,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('/patients/:id') // :id -> patient -> user_id
  public async getPatientMeasurements(
    @GetUser() user: UserRes,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
  ): Promise<PaginatedResult<ModifiedMeasurement>> {
    return this.measurementService.patientMeasurements(
      id,
      user.id,
      user.role,
      type || '',
      page || 1,
      limit || 10,
    );
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/patients/:id') // :id -> patient -> user_id
  public async createMeasurements(
    @GetUser() user: UserRes,
    @Param('id') id: string,
    @Body() data: MeasurementDTO,
  ): Promise<ModifiedMeasurement> {
    return this.measurementService.createPatientMeasurement(
      id,
      user.id,
      user.role,
      data,
    );
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/:id') // :id -> patient -> user_id
  public async updateMeasurementStatus(
    @Param('id') id: string,
    @Query('status') status: number,
    @Query('updated_by') updated_by: string
  ) {
    return this.measurementService.updateMeasurementStatus(
      id,
      status,
      updated_by

    );
  }
}

