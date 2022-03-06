import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Command, Console } from 'nestjs-console';
import { PoolInfoEntity } from 'src/models/entities/pool-info.entity';
import { PoolInfoRepository } from 'src/models/repositories/pool-info.repository';
import { DATA_POOL_INFO } from 'src/modules/seeder/pool-info.seeder';

@Console()
@Injectable()
export class SeederConsole {
  constructor(
    @InjectRepository(PoolInfoRepository)
    private poolInfoRepo: PoolInfoRepository,
  ) {}
  @Command({
    command: 'seeding-data',
    description: 'Seeding pool data',
  })
  async handle(): Promise<void> {
    await this.seedingPoolInfo();
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
  }
}
