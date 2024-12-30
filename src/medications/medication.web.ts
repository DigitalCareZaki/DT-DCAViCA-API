import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { MedicationController } from './medication.controller';
import { MedicationService } from './medication.service';

import { GetUser } from 'src/auth/decorators';

import { MedicationDTO } from './dto';

import { HealthRes, UserRes } from '@types';
import type { ModifiedMedication } from './types';

@Controller('web/medications')
export class MedicationWebController extends MedicationController {
  constructor(medicationService: MedicationService) {
    super(medicationService);
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
  public async getPatientMedication(
    @GetUser() user: UserRes,
    @Param('id') id: string,
    @Query('search') search: string,
  ): Promise<ModifiedMedication[]> {
    return this.getMedicationService().getPatientMedication(
      id,
      user.id,
      user.role,
      search || '',
    );
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/patients/:id') // :id -> patient -> user_id
  public async createPatientMedication(
    @GetUser() user: UserRes,
    @Param('id') id: string,
    @Body() data: MedicationDTO,
  ): Promise<ModifiedMedication> {
    return this.getMedicationService().createPatientMedication(
      id,
      user.id,
      user.role,
      data,
    );
  }
}
