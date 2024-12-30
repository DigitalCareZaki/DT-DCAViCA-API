import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const str = new Array(req.baseUrl.length).fill('=').join('');
    console.log('\n\n');
    console.log(str);
    console.log(req.baseUrl, ' : ', req.method);
    console.log(str, '\n\n');

    next();
  }
}
