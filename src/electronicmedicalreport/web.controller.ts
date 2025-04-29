import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ElectronicmedicalreportController } from './electronicmedicalreport.controller';
import { ElectronicmedicalreportService } from './electronicmedicalreport.service';
import { RolesGuard } from 'src/auth/guards';
import { Role } from 'src/auth/enums/role.enum';
import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { EMR_DTO } from './dto/emr.dto';

@Controller('web/emr')
export class EMRWebController extends ElectronicmedicalreportController {
  constructor(service: ElectronicmedicalreportService) {
    super(service);
  }

  @Get('/health')
  public async health() {
    return {
      status: 'running',
    };
  }

  @Post('/')
  @UseGuards(RolesGuard)
  @RequirePermission(Role.DOCTOR, Role.NURSE)
  @HttpCode(HttpStatus.CREATED)
  public async create(@Body() data: EMR_DTO) {
    const report = await this.getService().create(data);
    return report;
  }

  @Get('/')
  public async getPatientRecords(@Query('patient_id') patient_id: string, @Query('search') search: string) {
    console.log('getting records');
    console.log({ patient_id, search });
    return this.getService().getPatientRecords(patient_id, search ?? '');
  }
}
