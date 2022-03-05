import * as dotenv from 'dotenv';
dotenv.config();
import * as config from 'config';
import helmet from 'helmet';
import { join } from 'path';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ResponseTransformInterceptor } from 'src/shares/interceptors/response.interceptor';
import { BodyValidationPipe } from 'src/shares/pipes/body.validation.pipe';
import { AppModule } from 'src/app.module';

const appPort = config.get<number>('app.port');
const prefix = config.get<string>('app.prefix');

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });

  app.setGlobalPrefix(prefix);
  app.enableCors();
  app.useGlobalInterceptors(new ResponseTransformInterceptor());
  app.useGlobalPipes(new BodyValidationPipe());
  app.useStaticAssets(join(__dirname, '..', 'src/static'));
  app.use(helmet());

  await app.listen(appPort);
  const logger = app.get(Logger);
  logger.setContext('NestApplication');
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
