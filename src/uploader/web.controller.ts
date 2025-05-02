import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
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
  @Post('/')
  @UseInterceptors(FileInterceptor('file'))
  // public async upload(@UploadedFile() file: Express.Multer.File) {
  async upload(@UploadedFile() file: Express.Multer.File) {
    console.log('object >>>>>>>>>>> ', file);
    return this.getUploaderService().handleFile(file);
  }
}
