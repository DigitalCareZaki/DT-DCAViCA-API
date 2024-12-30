import { Injectable, NestMiddleware } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LogsMiddleware implements NestMiddleware {
  constructor(private readonly eventEmitter: EventEmitter2) {}
  use(req: Request, res: Response, next: NextFunction) {
    const [platform, module] = req.baseUrl
      ?.split('/api/v1/')
      ?.at(-1)
      ?.split('/');

    const payload = {
      method: req.method,
      endpoint: req.baseUrl,
      platform: platform?.toUpperCase(),
      module,
      token: req.headers.authorization,
    };

    this.eventEmitter.emitAsync('create_log', payload);

    next();
  }
}
