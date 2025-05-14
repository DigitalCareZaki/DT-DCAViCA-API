import { writeFileSync } from 'fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';

import type { } from './global';
import { ResponseInterceptor } from './interceptor/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS to allow all origins
  app.enableCors();

  // app.enableCors({
  //   origin: '*',
  // });

  // Enable CORS for all origins

  // app.enableCors({
  //   origin: true,
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  //   preflightContinue: false,
  //   optionsSuccessStatus: 204,
  // });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  app.setGlobalPrefix('api/v1/');

  await app.listen(process.env.PORT || 8080);

  const server = app.getHttpServer();
  const router = server._events.request._router;

  const routes: Array<{ path: string; method: string; module: string }> =
    router?.stack
      .map((layer) => {
        if (layer.route) {
          return {
            path: layer.route?.path,
            method: layer.route?.stack[0].method.toUpperCase(),
            module: layer?.route?.path?.replace('/api/v1/', '')?.split('/')[1],
          };
        }
      })
      .filter((item) => item !== undefined);

  const obj = {};

  routes?.forEach((el) => {
    const module = routes.filter((route) => route.module === el.module);

    Object.assign(obj, {
      [el.module]: module,
    });

    return {
      [el.module]: module,
    };
  });

  writeFileSync('routes.json', JSON.stringify(obj), 'utf-8');
}
bootstrap();
