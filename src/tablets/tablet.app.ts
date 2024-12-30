import { Controller } from '@nestjs/common';

import { TabletController } from './tablet.controller';
import { TabletService } from './tablet.service';

@Controller('app/tablets')
export class TabletAppController extends TabletController {
  constructor(tabletService: TabletService) {
    super(tabletService);
  }
}
