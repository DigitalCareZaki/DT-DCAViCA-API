
import { Global, Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { NotificationController } from './notification.controller';
import { SendgridService } from 'src/sendGrid/sendgrid.service';
import { TwilioService } from 'src/twilio/twilio.service';

@Global()
@Module({
    controllers: [NotificationController],
    providers: [FirebaseService, SendgridService, TwilioService,],
    exports: [FirebaseService],
})
export class FirebaseModule { }