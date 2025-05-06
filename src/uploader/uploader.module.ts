import { Module } from '@nestjs/common';

import { UploaderService } from './uploader.service';
import { UploaderController } from './uploader.controller';
import { UploaderAppController } from './app.controller';
import { UploaderWebController } from './web.controller';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryProvider } from './cloudinary.provider';

@Module({
  imports: [ConfigModule],
  providers: [CloudinaryProvider, UploaderService],
  controllers: [
    UploaderController,
    UploaderAppController,
    UploaderWebController,
  ],
})
export class UploaderModule { }
