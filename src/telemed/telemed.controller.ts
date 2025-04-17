import { Controller, UseGuards } from '@nestjs/common';
import { TelemedService } from './telemed.service';
import { JwtGuard } from 'src/auth/guards';

@Controller()
@UseGuards(JwtGuard)
export class TelemedController {
  constructor(private telemedService: TelemedService) { }

  public getTelemedService(): TelemedService {
    return this.telemedService;
  }
}
