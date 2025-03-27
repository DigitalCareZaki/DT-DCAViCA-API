import { Controller, Post, Body } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

@Controller('notifications')
export class NotificationController {
    constructor(private readonly firebaseService: FirebaseService) { }

    @Post('send')
    async sendNotification(
        @Body() { token, title, body }: { token: string; title: string; body: string }
    ) {
        return this.firebaseService.sendNotification(token, title, body);
    }
}