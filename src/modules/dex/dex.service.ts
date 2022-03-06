import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import BigNumber from 'bignumber.js';
import { UserInfoEntity } from 'src/models/entities/user-info.entity';
import { ChainInfoRepository } from 'src/models/repositories/chain-info.repository';
import { PoolInfoRepository } from 'src/models/repositories/pool-info.repository';
import { UserHistoryRepository } from 'src/models/repositories/user-history.repository';
import { UserInfoRepository } from 'src/models/repositories/user-info.repository';
import { BONE, MIN_SCORE_PER_BLOCK } from 'src/modules/dex/dex.const';

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
    blockNumber: string,
  ): Promise<boolean> {
    await this.updatePool(poolId, blockNumber);
    const userInfo = await this.userInfoRepo.getUserInfo(poolId, userAddress);
    const poolInfo = await this.poolInfoRepo.getPoolInfo(poolId);
    if (new BigNumber(userInfo.amount).gt('0')) {
      await this.updateUser(poolId, userAddress, blockNumber);
    } else {
      userInfo.last_block = blockNumber;
      userInfo.reward_debt_1 = '0';
      userInfo.reward_debt_2 = '0';
    }

    poolInfo.lp_token_amount = new BigNumber(poolInfo.lp_token_amount)
      .plus(amount)
      .toString();
    userInfo.amount = new BigNumber(userInfo.amount).plus(amount).toString();
    await this.poolInfoRepo.save(poolInfo);
    await this.userInfoRepo.save(userInfo);
    return true;
  }

  async unstake(
    poolId: number,
    userAddress: string,
    amount: BigNumber,
    blockNumber: string,
  ): Promise<boolean> {
    await this.updatePool(poolId, blockNumber);
    await this.updateUser(poolId, userAddress, blockNumber);
    const userInfo = await this.userInfoRepo.getUserInfo(poolId, userAddress);
    const poolInfo = await this.poolInfoRepo.getPoolInfo(poolId);
    userInfo.amount = new BigNumber(userInfo.amount).minus(amount).toString();
    poolInfo.lp_token_amount = new BigNumber(poolInfo.lp_token_amount)
      .minus(amount)
      .toString();
    await this.poolInfoRepo.save(poolInfo);
    await this.userInfoRepo.save(userInfo);
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

  async updatePool(poolId: number, blockNumber: string): Promise<boolean> {
    const poolInfo = await this.poolInfoRepo.getPoolInfo(poolId);
    if (blockNumber <= poolInfo.last_reward_block) {
      return true;
    }
    if (poolInfo.lp_token_amount == '0') {
      poolInfo.last_reward_block = blockNumber;
      await this.poolInfoRepo.save(poolInfo);
      return true;
    }

    const dataMultiplier = await this.getMultiplier(
      poolId,
      new BigNumber(poolInfo.last_reward_block),
      new BigNumber(blockNumber),
      new BigNumber(poolInfo.score_per_block),
    );

    poolInfo.total_score = new BigNumber(poolInfo.total_score)
      .plus(
        new BigNumber(poolInfo.lp_token_amount)
          .multipliedBy(dataMultiplier.multiplier)
          .div(BONE),
      )
      .toString();
    poolInfo.last_reward_block = blockNumber;
    poolInfo.score_per_block = (dataMultiplier.scorePerBlock.gt(
      MIN_SCORE_PER_BLOCK,
    )
      ? dataMultiplier.scorePerBlock
      : MIN_SCORE_PER_BLOCK
    ).toString();
    await this.poolInfoRepo.save(poolInfo);
    return true;
  }

  async updateLpAmount(poolId: number, amount: BigNumber): Promise<void> {
    const poolInfo = await this.poolInfoRepo.getPoolInfo(poolId);
    poolInfo.lp_token_amount = amount.plus(poolInfo.lp_token_amount).toString();
    await this.poolInfoRepo.save(poolInfo);
  }

  async updateUser(
    poolId: number,
    userAddress: string,
    blockNumber: string,
  ): Promise<void> {
    const userInfo = await this.userInfoRepo.getUserInfo(poolId, userAddress);
    userInfo.score = (
      await this.getUserScore(poolId, userAddress, userInfo, blockNumber)
    ).toString();
    userInfo.last_block = blockNumber;
    await this.userInfoRepo.save(userInfo);
  }

  async getUserScore(
    poolId: number,
    userAddress: string,
    userInfo: UserInfoEntity,
    blockNumber: string,
  ): Promise<BigNumber> {
    const userScorePerBlock = await this.userScorePerBlock(
      poolId,
      userAddress,
      userInfo,
    );
    const dataMultiplier = await this.getMultiplier(
      poolId,
      new BigNumber(userInfo.last_block),
      new BigNumber(blockNumber),
      userScorePerBlock,
    );
    const result = new BigNumber(userInfo.score).plus(
      dataMultiplier.multiplier.multipliedBy(userInfo.amount).div(BONE),
    );
    return result;
  }

  async userScorePerBlock(
    poolId: number,
    userAddress: string,
    userInfo: UserInfoEntity,
  ): Promise<BigNumber> {
    const poolInfo = await this.poolInfoRepo.getPoolInfo(poolId);
    let currentScorePerBlock = new BigNumber(poolInfo.score_per_block);
    const residuals = new BigNumber(poolInfo.last_reward_block)
      .minus(poolInfo.start_block)
      .mod(poolInfo.period);
    let end = new BigNumber(poolInfo.last_reward_block).minus(residuals);
    if (new BigNumber(userInfo.last_block).gte(end)) {
      return currentScorePerBlock;
    }

    while (
      end.gt(poolInfo.period) &&
      end.minus(poolInfo.period).gte(poolInfo.start_block)
    ) {
      if (
        new BigNumber(poolInfo.end_reduce_block).isZero() ||
        new BigNumber(poolInfo.end_reduce_block).gt(end)
      ) {
        currentScorePerBlock = currentScorePerBlock
          .div(poolInfo.reduction_rate)
          .multipliedBy(BONE);
      }
      if (
        new BigNumber(userInfo.last_block).lte(end) &&
        new BigNumber(userInfo.last_block).gt(end.minus(poolInfo.period))
      ) {
        return currentScorePerBlock;
        break;
      } else {
        end = end.minus(poolInfo.period);
      }
    }

    return currentScorePerBlock;
  }
}
