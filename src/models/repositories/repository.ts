import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChainInfoRepository } from 'src/models/repositories/chain-info.repository';
import { PoolInfoRepository } from 'src/models/repositories/pool-info.repository';
import { UserHistoryRepository } from 'src/models/repositories/user-history.repository';
import { UserInfoRepository } from 'src/models/repositories/user-info.repository';

const commonRepositories = [
  UserInfoRepository,
  UserHistoryRepository,
  PoolInfoRepository,
  ChainInfoRepository,
];

@Module({
  imports: [TypeOrmModule.forFeature(commonRepositories, 'default')],
  exports: [TypeOrmModule],
})
export class DatabaseCommonRepository {}
