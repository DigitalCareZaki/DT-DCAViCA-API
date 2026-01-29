import { Controller } from '@nestjs/common';
import { SitesService } from './sites.service';

@Controller('sites')
export class SitesController {
  constructor(private siteService: SitesService) {}

  getSiteService() {
    return this.siteService;
  }
}
