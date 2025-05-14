import { Controller, Post, Body } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

@Controller('notifications')
export class NotificationController {
    constructor(private readonly firebaseService: FirebaseService) { }

    @Post('send')
    async sendNotification(@Body() { sender, receiver, title, body }: { sender: string; receiver: string; title: string; body: string }) {
        return this.firebaseService.sendNotification(sender, receiver, title, body);
    }
}