import { Module } from '@nestjs/common';
import { TelemedService } from './telemed.service';
import { TelemedWebController } from './web.controller';
import { SendgridService } from 'src/sendGrid/sendgrid.service';
import { TelemedAppController } from './app.controller';
import { TwilioService } from 'src/twilio/twilio.service';
import { AdminService } from 'src/admin/admin.service';
import { SocketModule } from 'src/socket/socket.module';
import { TelemedListener } from './telemed.listener';
import { UploaderService } from 'src/uploader/uploader.service';
import { CloudinaryProvider } from 'src/uploader/cloudinary.provider';

@Module({
  imports: [SocketModule],
  controllers: [TelemedWebController, TelemedAppController,],
  providers: [
    TelemedService,
    TelemedListener,
    SendgridService,
    TwilioService,
    AdminService,
    UploaderService,
    CloudinaryProvider
  ],
})
export class TelemedModule { }
