import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import { RagService } from './rag.service';
import { GetUser } from 'src/auth/decorators';
import { HealthRes, UserRes } from '@types';
import type { PatientRag } from './types';
import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { JwtGuard, RolesGuard } from 'src/auth/guards';
import { Role } from 'src/auth/enums/role.enum';

@Controller('web/rag')
export class RagWebController {
  constructor(private readonly ragService: RagService) { }

  @HttpCode(HttpStatus.OK)
  @Get('/health')
  public async health(): Promise<HealthRes> {
    return {
      status: 'running',
      availableRoutes: [],
    };
  }

  @UseGuards(JwtGuard, RolesGuard)
  @RequirePermission(Role.DOCTOR, Role.NURSE, Role.PATIENT)
  @HttpCode(HttpStatus.OK)
  @Get()
  public async getAllPatientsRag(
    @GetUser() user: UserRes,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
  ): Promise<PatientRag> {
    return this.ragService.getAllPatientRag(
      user.id,
      user.role,
      start_date,
      end_date,
    );
  }

  @UseGuards(JwtGuard, RolesGuard)
  @RequirePermission(Role.DOCTOR, Role.NURSE, Role.PATIENT)
  @HttpCode(HttpStatus.OK)
  @Get('/patients/:id') // :id -> patient -> user_id
  public async getSinglePatientRag(@GetUser() user: UserRes, @Param('id') id: string, @Query('start_date') start_date?: string, @Query('end_date') end_date?: string) {
    return this.ragService.getSinglePatientRag(
      id,
      user.id,
      user.role,
      start_date,
      end_date,
    );
  }
}
