
import { Global, Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { NotificationController } from './notification.controller';

@Global()
@Module({
    controllers: [NotificationController],
    providers: [FirebaseService],
    exports: [FirebaseService],
})
export class FirebaseModule { }