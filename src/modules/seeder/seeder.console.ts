import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Command, Console } from 'nestjs-console';
import { getConfig } from 'src/configs';
import { ChainInfoEntity } from 'src/models/entities/chain-info.entity';
import { PoolInfoEntity } from 'src/models/entities/pool-info.entity';
import { ChainInfoRepository } from 'src/models/repositories/chain-info.repository';
import { PoolInfoRepository } from 'src/models/repositories/pool-info.repository';
import { UserInfoRepository } from 'src/models/repositories/user-info.repository';
import { DATA_POOL_INFO, POOL_TEST } from 'src/modules/seeder/pool-info.seeder';

@Console()
@Injectable()
export class SeederConsole {
  constructor(
    @InjectRepository(PoolInfoRepository)
    private poolInfoRepo: PoolInfoRepository,
    @InjectRepository(ChainInfoRepository)
    private chainInfoRepo: ChainInfoRepository,
    @InjectRepository(UserInfoRepository)
    private userInfoRepo: UserInfoRepository,
  ) {}
  @Command({
    command: 'seeding-data',
    description: 'Seeding pool data',
  })
  async handle(): Promise<void> {
    await Promise.all([
      this.seedingPoolInfo(),
      this.seedingChainInfo(),
      this.seedingUserInfo(),
    ]);
  }

  private async seedingPoolInfo(): Promise<void> {
    await this.poolInfoRepo.clear();
    for (let i = 0; i < DATA_POOL_INFO.length; i++) {
      const element = DATA_POOL_INFO[i];
      const item = new PoolInfoEntity();
      item.lp_token = element.lp_token;
      item.start_block = element.start_block;
      item.reward_token_1 = element.reward_token_1;
      item.reward_token_2 = element.reward_token_2;
      item.reward_per_block_1 = element.reward_per_block_1;
      item.reward_per_block_2 = element.reward_per_block_2;
      item.score_per_block = element.score_per_block;
      item.period = element.period;
      item.reduction_rate = element.reduction_rate;
      item.end_reduce_block = element.end_reduce_block;
      await this.poolInfoRepo.save(item);
    }

    const isTest = getConfig().get<boolean>('app.isTest');
    if (isTest) {
      for (let i = 0; i < POOL_TEST.length; i++) {
        const element = POOL_TEST[i];
        const item = new PoolInfoEntity();
        item.lp_token = element.lp_token;
        item.start_block = element.start_block;
        item.reward_token_1 = element.reward_token_1;
        item.reward_token_2 = element.reward_token_2;
        item.reward_per_block_1 = element.reward_per_block_1;
        item.reward_per_block_2 = element.reward_per_block_2;
        item.score_per_block = element.score_per_block;
        item.period = element.period;
        item.reduction_rate = element.reduction_rate;
        item.end_reduce_block = element.end_reduce_block;
        await this.poolInfoRepo.save(item);
      }
    }
  }

  private async seedingChainInfo(): Promise<void> {
    await this.chainInfoRepo.clear();
    const item = new ChainInfoEntity();
    item.current_block = '0';
    item.id = 1;
    item.max_block = '42199603';
    await this.chainInfoRepo.save(item);
  }

  private async seedingUserInfo(): Promise<void> {
    await this.userInfoRepo.clear();
  }
}
