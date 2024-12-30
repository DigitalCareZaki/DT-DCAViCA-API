import { Controller, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards';
import { EmailsService } from './emails.service';

@Controller()
@UseGuards(JwtGuard)
export class EmailsController {
  constructor(private readonly emailService: EmailsService) {}

  public getEmailService(): EmailsService {
    return this.emailService;
  }
}
