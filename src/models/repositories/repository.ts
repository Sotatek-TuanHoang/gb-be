import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrawlStatusRepository } from 'src/models/repositories/crawler-status.repository';

const commonRepositories = [CrawlStatusRepository];

@Module({
  imports: [TypeOrmModule.forFeature(commonRepositories, 'default')],
  exports: [TypeOrmModule],
})
export class DatabaseCommonModule {}
