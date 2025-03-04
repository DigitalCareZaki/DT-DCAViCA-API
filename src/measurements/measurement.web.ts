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

import { MeasurementController } from './measurement.controller';
import { MeasurementService } from './measurement.service';

import { RolesGuard } from 'src/auth/guards';
import { Role } from 'src/auth/enums/role.enum';
import { RequirePermission } from 'src/auth/decorators/role.decorator';

import { GetUser } from 'src/auth/decorators';

import { MeasurementDTO } from './dto';

import { UserRes } from '@types';
import type { ModifiedMeasurement } from './types';

@Controller('web/measurements')
export class MeasurementWebController extends MeasurementController {
  constructor(measurementService: MeasurementService) {
    super(measurementService);
  }

  @HttpCode(HttpStatus.OK)
  @Get('')
  @UseGuards(RolesGuard)
  @RequirePermission(Role.DOCTOR, Role.NURSE)
  public async getAllPatientMeasurements(
    @GetUser() user: UserRes,
    @Query('type') type?: string,
  ): Promise<ModifiedMeasurement[]> {
    return this.getMeasurementService().getMeasurementsOfAllPatients(
      user.id,
      user.role,
      type,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('latestReadings')
  @UseGuards(RolesGuard)
  @RequirePermission(Role.DOCTOR, Role.NURSE)
  public async getPatientListWithLatestReadings(
    @GetUser() user: UserRes,
  ): Promise<ModifiedMeasurement[]> {
    return this.getMeasurementService().getPatientListWithLatestReadings(
      user.id,
      user.role,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('/patients/:id') // :id -> patient -> user_id
  public async getPatientMeasurements(
    @GetUser() user: UserRes,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('type') type?: string,
  ): Promise<{
    data: ModifiedMeasurement[];
    // meta: { total: number; page: number; pageSize: number; pageCount: number };
  }> {
    return this.getMeasurementService().patientMeasurements(
      id,
      user.id,
      user.role,
      type,
      page,
      pageSize,
    );
  }

  // @HttpCode(HttpStatus.OK)
  // @Get('/patients/:id') // :id -> patient -> user_id
  // public async getPatientMeasurements(
  //   @GetUser() user: UserRes,
  //   @Param('id') id: string,
  //   @Query('type') type?: string,
  // ): Promise<ModifiedMeasurement[]> {
  //   return this.getMeasurementService().patientMeasurements(
  //     id,
  //     user.id,
  //     user.role,
  //     type,
  //   );
  // }

  @HttpCode(HttpStatus.CREATED)
  @Post('/patients/:id') // :id -> patient -> user_id
  public async createMeasurements(
    @GetUser() user: UserRes,
    @Param('id') id: string,
    @Body() data: MeasurementDTO,
  ): Promise<ModifiedMeasurement> {
    return this.getMeasurementService().createPatientMeasurement(
      id,
      user.id,
      user.role,
      data,
    );
  }

  // @HttpCode(HttpStatus.OK)
  // @Post('/:measurement_id')
  // public async updateMeasurementStatus(
  //   @GetUser() user: UserRes,
  //   @Param('measurement_id') measurement_id: string,
  //   @Query('status') status: string,
  //   @Query('updated_by') updated_by: string,
  // ) {
  //   console.log('measurement_id', measurement_id);
  //   console.log('status', status);
  //   console.log('updated_by', updated_by);
  //   return this.getMeasurementService().updateMeasurementStatus(
  //     measurement_id,
  //     parseInt(status),
  //     updated_by,
  //   );
  // }
}
