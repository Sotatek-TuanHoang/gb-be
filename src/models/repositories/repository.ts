import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrawlStatusRepository } from 'src/models/repositories/crawler-status.repository';
import { TasksService } from './index';

const commonRepositories = [CrawlStatusRepository];

@Module({
  imports: [TypeOrmModule.forFeature(commonRepositories, 'default')],
  providers: [TasksService],
  exports: [TypeOrmModule],
})
export class DatabaseCommonModule {}
