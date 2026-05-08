
import { Global, Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { NotificationController } from './notification.controller';
import { SendgridService } from 'src/sendGrid/sendgrid.service';
import { TwilioService } from 'src/twilio/twilio.service';
import { SocketModule } from 'src/socket/socket.module';

@Global()
@Module({
    controllers: [NotificationController],
    imports: [SocketModule],
    providers: [FirebaseService, SendgridService, TwilioService,],
    exports: [FirebaseService],
})
export class FirebaseModule { }
