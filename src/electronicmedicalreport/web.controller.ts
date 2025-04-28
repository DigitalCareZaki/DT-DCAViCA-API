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
import { GetUser } from 'src/auth/decorators';
import { UserRes } from '@types';
import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { EMRDto } from './dto/emr.dto';

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

  @UseGuards(RolesGuard)
  @RequirePermission(Role.PATIENT)
  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  public async create(@GetUser() user: UserRes, @Body() data: EMRDto) {
    return this.getService().create(user, data);
  }

  @Get('/')
  public async getPatientRecords(@Query('patient_id') patient_id: string, @Query('search') search: string) {
    console.log({ patient_id, search });
    return this.getService().getPatientRecords(patient_id, search ?? '');
  }
}
