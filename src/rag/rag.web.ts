import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';

import { RagController } from './rag.controller';
import { RagService } from './rag.service';

import { GetUser } from 'src/auth/decorators';

import { HealthRes, UserRes } from '@types';
import type { PatientRag } from './types';

@Controller('web/rag')
export class RagWebController extends RagController {
  constructor(ragService: RagService) {
    super(ragService);
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
  @Get()
  public async getAllPatientsRag(
    @GetUser() user: UserRes,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
  ): Promise<PatientRag> {
    return this.getRagService().getAllPatientRag(
      user.id,
      user.role,
      start_date,
      end_date,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('/patients/:id') // :id -> patient -> user_id
  public async getSinglePatientRag(
    @GetUser() user: UserRes,
    @Param('id') id: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
  ): Promise<PatientRag> {
    return this.getRagService().getSinglePatientRag(
      id,
      user.id,
      user.role,
      start_date,
      end_date,
    );
  }
}
