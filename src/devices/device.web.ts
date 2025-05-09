import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Patch,
} from '@nestjs/common';

import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';

import { GetUser } from 'src/auth/decorators';

import { DeviceDTO, ManageDeviceDTO, PatientDeviceDTO } from './dto';

import type { HealthRes, UserRes } from '@types';
import type { Device } from './types';
import { Measurement, MeasurementType } from '@prisma/client';

@Controller('web/devices')
export class DeviceWebController extends DeviceController {
  constructor(deviceService: DeviceService) {
    super(deviceService);
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
  public async getAllDevices(@GetUser() user: UserRes): Promise<Device[]> {
    return this.getDeviceService().getAllDevices(
      user.id,
      user.organization_id,
      user.role,
    );
  }

  // get single device
  @HttpCode(HttpStatus.OK)
  @Get('/:deviceId')
  public async getSingleDevice(
    @GetUser() user: UserRes,
    @Param('deviceId') deviceId: string,
  ): Promise<Device> {
    return this.getDeviceService().getSingleDevice(
      deviceId,
      user.id,
      user.organization_id,
      user.role,
    );
  }
  // get devices category wise
  @HttpCode(HttpStatus.OK)
  @Get('devices/:category')
  public async getDeviceList(
    @GetUser() user: UserRes,
    @Param('category') category: MeasurementType,
  ) {
    return this.getDeviceService().getDeviceList(
      category
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('/patients/:id') // :id -> patient -> user_id
  public async getAllDevicesPerPatient(
    @GetUser() user: UserRes,
    @Param('id') id: string,
  ): Promise<Device[]> {
    return this.getDeviceService().getAllDevicesForPatient(
      id,
      user.id,
      user.organization_id,
      user.role,
    );
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  public async createDevice(
    @GetUser() user: UserRes,
    @Body() data: DeviceDTO,
  ): Promise<Device> {
    return this.getDeviceService().createDevice(
      user.id,
      user.organization_id,
      data,
    );
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/create-device')
  public async createPatientDevice(
    @GetUser() user: UserRes,
    @Body() data: DeviceDTO,
  ): Promise<Device> {
    return this.getDeviceService().createDevice(
      user.id,
      user.organization_id,
      data,
    );
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/assign-device')
  public async assignDevice(
    @GetUser() user: UserRes,
    @Body() data: PatientDeviceDTO,
  ) {
    console.log(data, 'device data ===========>>>');
    return this.getDeviceService().assignDevice(
      user.id,
      data,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Patch('/:deviceId') // :deviceId -> device -> id
  public async updateDevice(
    @GetUser() user: UserRes,
    @Param('deviceId') deviceId: string,
    @Body() data: DeviceDTO,
  ): Promise<Device> {
    return this.getDeviceService().updateDevice(
      deviceId,
      user.organization_id,
      data,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('/manage')
  public async manageDevice(
    @GetUser() user: UserRes,
    @Body() data: ManageDeviceDTO,
  ): Promise<any> {
    return this.getDeviceService().manageDevice(
      user.id,
      user.organization_id,
      user.role,
      data,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Delete('/:deviceId')
  public async deleteDevice(
    @GetUser() user: UserRes,
    @Param('deviceId') deviceId: string,
  ): Promise<any> {
    return await this.getDeviceService().deleteDevice(
      user.id,
      user.organization_id,
      user.role,
      deviceId,
    );
  }
}
