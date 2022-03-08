import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import BigNumber from 'bignumber.js';
import {
  UserInfoEntity,
  UserInfoStatus,
} from 'src/models/entities/user-info.entity';
import { ChainInfoRepository } from 'src/models/repositories/chain-info.repository';
import { PoolInfoRepository } from 'src/models/repositories/pool-info.repository';
import { UserHistoryRepository } from 'src/models/repositories/user-history.repository';
import { UserInfoRepository } from 'src/models/repositories/user-info.repository';
import { BONE, MIN_SCORE_PER_BLOCK } from 'src/modules/dex/dex.const';
import { erc20ABI } from 'src/shares/abis/common-abi';
import { getConfig } from 'src/configs';
// eslint-disable-next-line
const Web3 = require('xdc3');
import * as EthereumTx from 'ethereumjs-tx';

@Injectable()
export class DexService {
  private readonly web3;
  constructor(
    @InjectRepository(PoolInfoRepository)
    private poolInfoRepo: PoolInfoRepository,
    @InjectRepository(UserInfoRepository)
    private userInfoRepo: UserInfoRepository,
    @InjectRepository(UserHistoryRepository)
    private userHistoryRepo: UserHistoryRepository,
    @InjectRepository(ChainInfoRepository)
    private chainInfoRepo: ChainInfoRepository,
  ) {
    const xinFinRpc = getConfig().get<string>('xin_fin_rpc');
    this.web3 = new Web3();
    this.web3.setProvider(new Web3.providers.HttpProvider(xinFinRpc));
  }

  async stake(
    poolId: number,
    userAddress: string,
    amount: BigNumber,
    blockNumber: string,
  ): Promise<boolean> {
    await this.updatePool(poolId, blockNumber);
    let userInfo = await this.userInfoRepo.getUserInfo(poolId, userAddress);
    const poolInfo = await this.poolInfoRepo.getPoolInfo(poolId);
    if (new BigNumber(userInfo.amount).gt('0')) {
      await this.updateUser(poolId, userAddress, blockNumber);
      // claim last reward
      await this.calculateReward(poolId, userAddress, blockNumber);
      userInfo = await this.userInfoRepo.getUserInfo(poolId, userAddress);
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
    if (!userInfo.id) {
      delete userInfo.id;
    }
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
    await this.calculateReward(poolId, userAddress, blockNumber);
    const userInfo = await this.userInfoRepo.getUserInfo(poolId, userAddress);
    const poolInfo = await this.poolInfoRepo.getPoolInfo(poolId);
    userInfo.amount = new BigNumber(userInfo.amount).minus(amount).toString();
    poolInfo.lp_token_amount = new BigNumber(poolInfo.lp_token_amount)
      .minus(amount)
      .toString();
    await this.poolInfoRepo.save(poolInfo);
    if (!userInfo.id) {
      delete userInfo.id;
    }
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
    if (!userInfo.id) {
      delete userInfo.id;
    }
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

  async calculateReward(
    poolId: number,
    userAddress: string,
    blockNumber: string,
  ): Promise<boolean> {
    const userInfo = await this.userInfoRepo.getUserInfo(poolId, userAddress);
    const poolInfo = await this.poolInfoRepo.getPoolInfo(poolId);
    const userScorePerBlock = await this.userScorePerBlock(
      poolId,
      userAddress,
      userInfo,
    );
    const poolMultiplier = await this.getMultiplier(
      poolId,
      new BigNumber(poolInfo.last_reward_block),
      new BigNumber(blockNumber),
      new BigNumber(poolInfo.score_per_block),
    );
    const userMultiplier = await this.getMultiplier(
      poolId,
      new BigNumber(userInfo.last_block),
      new BigNumber(blockNumber),
      userScorePerBlock,
    );
    const userScore = userMultiplier.multiplier
      .multipliedBy(userInfo.amount)
      .div(BONE)
      .plus(userInfo.score);
    const totalScore = poolMultiplier.multiplier
      .multipliedBy(poolInfo.lp_token_amount)
      .div(BONE)
      .plus(poolInfo.total_score);
    const reward_1 = new BigNumber(blockNumber)
      .minus(poolInfo.start_block)
      .multipliedBy(poolInfo.reward_per_block_1);
    const reward_2 = new BigNumber(blockNumber)
      .minus(poolInfo.start_block)
      .multipliedBy(poolInfo.reward_per_block_2);

    const userRewardAll_1 = reward_1.multipliedBy(userScore).div(totalScore);
    const userRewardAll_2 = reward_2.multipliedBy(userScore).div(totalScore);

    const userReward_1 = userRewardAll_1.gte(userInfo.reward_debt_1)
      ? userRewardAll_1.minus(userInfo.reward_debt_1)
      : new BigNumber(0);
    const userReward_2 = userRewardAll_2.gte(userInfo.reward_debt_2)
      ? userRewardAll_2.minus(userInfo.reward_debt_2)
      : new BigNumber(0);

    userInfo.pending_reward_1 = userReward_1
      .plus(userInfo.pending_reward_1)
      .toString();
    userInfo.pending_reward_2 = userReward_2
      .plus(userInfo.pending_reward_2)
      .toString();
    userInfo.reward_debt_1 = userReward_1
      .plus(userInfo.reward_debt_1)
      .toString();

    userInfo.reward_debt_2 = userReward_2
      .plus(userInfo.reward_debt_2)
      .toString();

    if (!userInfo.id) {
      delete userInfo.id;
    }
    await this.userInfoRepo.save(userInfo);
    return true;
  }

  async getDataUser(userAddress: string): Promise<any> {
    const [userReward, userHistories] = await Promise.all([
      this.userInfoRepo.find({
        where: {
          user_address: userAddress,
        },
      }),
      this.userHistoryRepo.find({
        where: {
          user_address: userAddress,
        },
      }),
    ]);

    return {
      reward: userReward,
      histories: userHistories,
    };
  }

  // async getDataAllUser(page: number, limit: number, userAddress: string[]): Promise<any> {

  // }

  async claim(userAddress: string): Promise<UserInfoEntity[]> {
    if (!(await this.updateDataBeforeClaim(userAddress))) {
      throw new HttpException('User is invalid', 400);
    }
    const matcherAddress = getConfig().get<string>('matcher_address');
    const chainId = getConfig().get<number>('chain_id');
    // const _gasLimit = await contract.methods
    //   .transfer(
    //     'xdce861A5bfFAdE378166232a79289eb81E24c98fdf',
    //     '1000000000000000000',
    //   )
    //   .estimateGas({ from: matcherAddress });
    // const gasLimit = this.web3.utils.toBN(_gasLimit);
    const gasPrice = this.web3.utils.toBN(await this.web3.eth.getGasPrice());
    const dataClaim = await this.userInfoRepo.getDataClaimByUserAddress(
      userAddress,
    );

    if (dataClaim.length === 0) return [];

    const dataReturn = [];
    for (const claim of dataClaim) {
      const poolInfo = await this.poolInfoRepo.findOne(claim.pool_id);
      if (!poolInfo) {
        claim.note = 'No pool found';
        claim.status = UserInfoStatus.Failed;
        dataReturn.push(claim);
        continue;
      }

      try {
        const count = await this.web3.eth.getTransactionCount(matcherAddress);

        const contractReward1 = new this.web3.eth.Contract(
          erc20ABI,
          poolInfo.reward_token_1.toLowerCase(),
        );
        const data1 = await contractReward1.methods
          .transfer(claim.user_address, claim.pending_reward_1)
          .encodeABI();
        const rawTx1 = {
          nonce: this.web3.utils.toHex(count),
          gasLimit: this.web3.utils.toHex(2000000),
          gasPrice: this.web3.utils.toHex(gasPrice),
          data: data1,
          to: poolInfo.reward_token_1.toLowerCase(),
          chainId: chainId,
        };
        const tx1 = new EthereumTx(rawTx1);

        const contractReward2 = new this.web3.eth.Contract(
          erc20ABI,
          poolInfo.reward_token_2.toLowerCase(),
        );
        const data2 = await contractReward2.methods
          .transfer(claim.user_address, claim.pending_reward_2)
          .encodeABI();
        const rawTx2 = {
          nonce: this.web3.utils.toHex(count),
          gasLimit: this.web3.utils.toHex(2000000),
          gasPrice: this.web3.utils.toHex(gasPrice),
          data: data2,
          to: poolInfo.reward_token_2,
          chainId: chainId,
        };
        const tx2 = new EthereumTx(rawTx2);

        claim.txid1 = `0x${tx1.hash().toString('hex')}`;
        claim.txid2 = `0x${tx2.hash().toString('hex')}`;
        claim.signed_tx1 = tx1.serialize().toString('hex');
        claim.signed_tx2 = tx2.serialize().toString('hex');
        claim.status = UserInfoStatus.Claim;

        dataReturn.push(claim);
      } catch (error) {
        claim.status = UserInfoStatus.Failed;
        claim.note = JSON.stringify(error);
        dataReturn.push(claim);
      }
    }
    await this.userInfoRepo.save(dataReturn);
    return dataReturn;
  }

  async updateDataBeforeClaim(userAddress: string): Promise<boolean> {
    const chainInfo = await this.chainInfoRepo.findOne({ id: 1 });
    if (!chainInfo.current_block) {
      return false;
    }

    if (chainInfo.current_block != chainInfo.max_block) {
      return false;
    }

    const maxBlock = chainInfo.max_block;
    const userData = await this.userInfoRepo.find({
      where: {
        user_address: userAddress,
      },
    });

    if (!userData || userData == []) {
      return false;
    }

    for (let i = 0; i < userData.length; i++) {
      const item = userData[i];
      await this.stake(item.pool_id, userAddress, new BigNumber(0), maxBlock);
    }
    return true;
  }
}
