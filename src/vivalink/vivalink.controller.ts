import {
  Controller,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Param,
  Query,
} from '@nestjs/common';

import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { VivalinkService } from './vivalink.service';
import { JwtGuard, RolesGuard } from 'src/auth/guards';
import { Role } from 'src/auth/enums/role.enum';
import type { VLAllPatients, VLSinglePatientECGData } from './types';
import { GetUser } from 'src/auth/decorators';
import { UserRes } from '@types';

@Controller('vl')
@UseGuards(JwtGuard, RolesGuard)
@RequirePermission(Role.DOCTOR, Role.PATIENT)
export class VivalinkController {
  constructor(private readonly vivalinkService: VivalinkService) {
    console.log(
      'VivalinkService initialized',
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('vlpatients/:doctorId')   // doctorID mean doctor's user id, this method is userd for patient app avicardia
  public async getVlPatients(

    @Param('doctorId') doctorId: string,
  ): Promise<VLAllPatients> {

    return await this.vivalinkService.getVlPatients(doctorId);
  }
  @HttpCode(HttpStatus.OK)
  @Get('patients')
  public async getPatients(
    @GetUser() user: UserRes,
  ): Promise<VLAllPatients> {

    return await this.vivalinkService.getPatients(user);
  }

  @HttpCode(HttpStatus.OK)
  @Get('appPatients')
  public async getAppPatients(): Promise<VLAllPatients> {
    return this.vivalinkService.getAppPatients();
  }

  // @HttpCode(HttpStatus.OK)
  // @Get('patients/:patchSn')
  // public async getPatientData(
  //   @Param('patchSn') patchSn: string,
  //   @Query('duration') duration: string = '1 minute',
  // ): Promise<VLSinglePatientECGData> {
  //   return this.vivalinkService.getPatientData(patchSn, duration);
  // }

  @HttpCode(HttpStatus.OK)
  @Get('patients/:subjectId')
  public async getPatientData(
    @Param('subjectId') subjectId: string,
    @Query('duration') duration: string = '1 minute',
  ): Promise<VLSinglePatientECGData> {
    return this.vivalinkService.getPatientDataBySubjectId(subjectId, duration);
  }

  public getVivalinkService(): VivalinkService {
    return this.vivalinkService;
  }
}
