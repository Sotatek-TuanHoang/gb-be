import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrawlStatusRepository } from 'src/models/repositories/crawler-status.repository';
import { OrdersConsole } from './index';

const commonRepositories = [CrawlStatusRepository];

@Module({
  imports: [TypeOrmModule.forFeature(commonRepositories, 'default')],
  providers: [OrdersConsole],
  exports: [TypeOrmModule],
})
export class DatabaseCommonModule {}
