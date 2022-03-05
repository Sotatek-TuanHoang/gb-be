import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import BigNumber from 'bignumber.js';
import { ChainInfoRepository } from 'src/models/repositories/chain-info.repository';
import { PoolInfoRepository } from 'src/models/repositories/pool-info.repository';
import { UserHistoryRepository } from 'src/models/repositories/user-history.repository';
import { UserInfoRepository } from 'src/models/repositories/user-info.repository';
import { BONE } from 'src/modules/dex/dex.const';

@Injectable()
export class DexService {
  constructor(
    @InjectRepository(PoolInfoRepository)
    private poolInfoRepo: PoolInfoRepository,
    @InjectRepository(UserInfoRepository)
    private userInfoRepo: UserInfoRepository,
    @InjectRepository(UserHistoryRepository)
    private userHistoryRepo: UserHistoryRepository,
    @InjectRepository(ChainInfoRepository)
    private chainInfoRepo: ChainInfoRepository,
  ) {}

  async stake(
    poolId: number,
    userAddress: string,
    amount: BigNumber,
  ): Promise<boolean> {
    poolId;
    userAddress;
    amount;
    return true;
  }

  async getMultiplier(
    poolId: number,
    from: BigNumber,
    to: BigNumber,
    scorePerBlock: BigNumber,
  ): Promise<{ multiplier: BigNumber; scorePerBlock: BigNumber }> {
    const result = {
      multiplier: new BigNumber('0'),
      scorePerBlock: scorePerBlock,
    };

    const poolInfo = await this.poolInfoRepo.getPoolInfo(poolId);
    const period = new BigNumber(poolInfo.period);
    const rate = new BigNumber(poolInfo.reduction_rate);
    const startBlock = new BigNumber(poolInfo.start_block);
    const firstRange = period.minus(from.minus(startBlock).mod(period));
    const multiplierRange = to.minus(from);

    //
    let multiplier = new BigNumber(0);
    let start = new BigNumber(from.toString());

    if (firstRange.gte(multiplierRange)) {
      result.multiplier = multiplier.plus(
        to.minus(start).multipliedBy(scorePerBlock),
      );
      return result;
    }

    multiplier = multiplier.plus(firstRange.multipliedBy(scorePerBlock));
    start = start.plus(firstRange);

    if (
      poolInfo.end_reduce_block == '0' ||
      new BigNumber(poolInfo.end_reduce_block).gt(start)
    ) {
      scorePerBlock = scorePerBlock.multipliedBy(rate).div(BONE);
    }

    while (start.gt(to)) {
      if (start.plus(period).gte(to)) {
        multiplier = multiplier.plus(
          to.minus(start).multipliedBy(scorePerBlock),
        );
        break;
      } else {
        multiplier = multiplier.plus(period.multipliedBy(scorePerBlock));
        start = start.plus(period);
        scorePerBlock = scorePerBlock.multipliedBy(rate).div(BONE);
      }
    }

    result.multiplier = multiplier;
    result.scorePerBlock = scorePerBlock;

    return result;
  }

  async updatePool(poolId: number, blockNumber): Promise<boolean> {
    const poolInfo = await this.poolInfoRepo.getPoolInfo(poolId);
    if (blockNumber <= poolInfo.last_reward_block) {
      return true;
    }

    const blockPassed = new BigNumber(blockNumber).minus(
      poolInfo.last_reward_block,
    );
    return true;
  }
}
