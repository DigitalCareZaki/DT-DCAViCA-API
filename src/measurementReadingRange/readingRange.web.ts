import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ReadingRangeController } from './readingRange.controller';
import { ReadingRangeService } from './readingRange.service';

import { GetUser } from 'src/auth/decorators';

import { ReadingRangeDTO } from './dto';

import type { HealthRes, UserRes } from '@types';
import type { PatientReadingRangeAlert } from './types';

@Controller('web/measurements/ranges')
export class ReadingRangeWebController extends ReadingRangeController {
  constructor(readingRange: ReadingRangeService) {
    super(readingRange);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/health')
  public async health(): Promise<HealthRes> {
    return {
      status: 'running',
      availableRoutes: [],
    };
  }

  @HttpCode(HttpStatus.OK)
  @Get('/patients/:id') // :id -> patient -> user_id
  public async getPatientAlerts(
    @GetUser() user: UserRes,
    @Param('id') id: string,
  ): Promise<PatientReadingRangeAlert[]> {
    return this.getReadingRangeService().getAlertForPatient(id, user.id);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  public async createOrUpdatePatientAlert(
    @GetUser() user: UserRes,
    @Body() data: ReadingRangeDTO,
  ): Promise<PatientReadingRangeAlert> {
    return this.getReadingRangeService().createOrUpdateAlertForPatient(
      user.id,
      data,
    );
  }
}
