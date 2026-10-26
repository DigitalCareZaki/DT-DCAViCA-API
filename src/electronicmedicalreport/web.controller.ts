import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ElectronicmedicalreportService } from './electronicmedicalreport.service';
import { JwtGuard } from 'src/auth/guards';
import { EMR_DTO } from './dto/emr.dto';
import { GetUser } from 'src/auth/decorators';
import { UserRes } from '@types';

@Controller('web/emr')
@UseGuards(JwtGuard)
export class EMRWebController {
  constructor(private readonly service: ElectronicmedicalreportService) { }

  @Get('/health')
  public async health() {
    return { status: 'running' };
  }

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  public async create(@Body() data: EMR_DTO) {
    const report = await this.service.create(data);
    return report;
  }

  @Get('/reports') // for app
  public async getPatientRecords(@Query('patient_id') patient_id: string, @Query('search') search: string, @Query('page') page = 1, @Query('limit') limit = 10) {
    console.log('getting records');
    console.log({ patient_id, search });
    return this.service.getPatientRecords(patient_id, search ?? '', +page, +limit);
  }
  @Get('/') // for app
  public async getAppPatientRecords(@Query('patient_id') patient_id: string, @Query('search') search: string) {
    console.log('getting records');
    console.log({ patient_id, search });
    return this.service.getAppPatientRecords(patient_id, search ?? '');
  }




  @HttpCode(HttpStatus.OK)
  @Delete('/:id') // :id -> contact_id
  public async deleteReport(
    @GetUser() user: UserRes,
    @Param('id') id: string,
  ) {
    return this.service.deleteReport(id);
  }
}
