import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();

        const isMobile = request.headers?.ismobile || '';

        return next.handle().pipe(
            map((data) => {
                if (isMobile)
                    return {
                        statusCode: 200,
                        success: true,
                        data: (data.data && Array.isArray(data.data)) ? data.data : data,
                    };

                return data;
            }),
        );
    }
}
