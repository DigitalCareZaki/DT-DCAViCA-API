import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { UploaderController } from './uploader.controller';
import { UploaderService } from './uploader.service';

import type { HealthRes } from '@types';

@Controller('web/uploader')
export class UploaderWebController extends UploaderController {
  constructor(uploaderService: UploaderService) {
    super(uploaderService);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/health')
  public health(): HealthRes {
    return {
      status: 'running',
      availableRoutes: [],
    };
  }
  @HttpCode(HttpStatus.OK)
  @Get('/ecg')
  async getEcgFromS3(
    @Query('date') date?: string,
    @Query('deviceId') deviceId?: string,
  ) {
    return this.getUploaderService().getEcgFromS3(date, deviceId);
  }


  @HttpCode(HttpStatus.OK)
  @Post('/')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    return this.getUploaderService().uploadToS3(file);
  }

  // @HttpCode(HttpStatus.OK)
  // @Post('/uploads3')
  // @UseInterceptors(FileInterceptor('file'))
  // async uploadS3(@UploadedFile() file: Express.Multer.File) {
  //   return await this.getUploaderService().uploadToS3(file);
  // }
}

