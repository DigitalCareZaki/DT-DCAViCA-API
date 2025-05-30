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
import { MedicationService } from './medication.service';
import { GetUser } from 'src/auth/decorators';
import { MedicationDTO } from './dto';
import { HealthRes, UserRes } from '@types';
import type { ModifiedMedication } from './types';
import { JwtGuard, RolesGuard } from 'src/auth/guards';
import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/auth/enums/role.enum';

@Controller('web/medications')
@UseGuards(JwtGuard, RolesGuard)
@RequirePermission(Role.DOCTOR, Role.NURSE, Role.PATIENT)
export class MedicationWebController {
  constructor(private readonly medicationService: MedicationService) { }

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
    return this.medicationService.getPatientMedication(
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
    return this.medicationService.createPatientMedication(
      id,
      user.id,
      user.role,
      data,
    );
  }
}
