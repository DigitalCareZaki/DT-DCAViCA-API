import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';

import { UploaderService } from './uploader.service';
import { UploaderController } from './uploader.controller';
import { UploaderAppController } from './app.controller';
import { UploaderWebController } from './web.controller';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: join(__dirname, '..', '..', 'uploads'),
        filename: (req, file, cb) => {
          const filename = `${Date.now()}.${file.originalname?.split('.')?.at(-1)}`;
          cb(null, filename);
        },
      }),
    }),
  ],
  providers: [UploaderService],
  controllers: [
    UploaderController,
    UploaderAppController,
    UploaderWebController,
  ],
})
export class UploaderModule {}
