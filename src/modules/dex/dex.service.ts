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
import {
  BONE,
  MIN_SCORE_PER_BLOCK,
  UserInfoAction,
} from 'src/modules/dex/dex.const';
import { erc20ABI } from 'src/shares/abis/common-abi';
import { getConfig } from 'src/configs';
// eslint-disable-next-line
const Web3 = require('xdc3');
import * as EthereumTx from 'ethereumjs-tx';
import { PoolInfoEntity } from 'src/models/entities/pool-info.entity';

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

  async initUserInfo(
    userInfo: UserInfoEntity,
    poolInfo: PoolInfoEntity,
  ): Promise<UserInfoEntity> {
    let scorePerBlock = new BigNumber(poolInfo.score_per_block);
    let period = new BigNumber(poolInfo.period).plus(poolInfo.start_block);
    let currentBlock = new BigNumber(poolInfo.start_block).plus('1');
    while (currentBlock.lte(userInfo.last_block)) {
      if (currentBlock.gt(period)) {
        period = period.plus(poolInfo.period);
        if (currentBlock.lte(poolInfo.end_reduce_block)) {
          scorePerBlock = scorePerBlock.minus(
            scorePerBlock.times(poolInfo.reduction_rate),
          );
        }
      }
      currentBlock = currentBlock.plus('1');
    }
    userInfo.current_score_per_block = scorePerBlock.toString();
    userInfo.current_period = period.toString();
    return userInfo;
  }

  async updateLPRewards(
    poolId: number,
    userAddress: string,
    action: UserInfoAction,
    amount: BigNumber,
    blockNumber: string,
  ): Promise<UserInfoEntity> {
    const poolInfo = await this.poolInfoRepo.getPoolInfo(poolId);
    let userInfo = await this.userInfoRepo.getUserInfoV2(poolId, userAddress);

    if (action === UserInfoAction.UnStake) {
      if (!userInfo) throw Error('No Data For UnStake');
      if (amount.gt(userInfo.amount)) {
        throw Error('Not enough amount for un stake');
      }
    }

    if (!userInfo) {
      const newUserInfo = new UserInfoEntity();
      newUserInfo.last_block = blockNumber;
      newUserInfo.user_address = userAddress;
      newUserInfo.pool_id = poolId;
      newUserInfo.amount = amount.toString();
      userInfo = await this.initUserInfo(newUserInfo, poolInfo);
      return await this.userInfoRepo.save(userInfo);
    }

    let currentBlock = new BigNumber(userInfo.last_block).plus('1');
    let scorePerBlock = new BigNumber(userInfo.current_score_per_block);
    let period = new BigNumber(userInfo.current_period);

    while (currentBlock.lte(blockNumber)) {
      if (currentBlock.gt(period)) {
        period = period.plus(poolInfo.period);
        if (currentBlock.lte(poolInfo.end_reduce_block)) {
          scorePerBlock = scorePerBlock.minus(
            scorePerBlock.times(poolInfo.reduction_rate),
          );
        }
      }
      const userScorePlus = new BigNumber(userInfo.amount)
        .times(scorePerBlock)
        .div(new BigNumber(10).pow(18));
      userInfo.score = new BigNumber(userInfo.score)
        .plus(userScorePlus)
        .toString();
      poolInfo.total_score = new BigNumber(poolInfo.total_score)
        .plus(userScorePlus)
        .toString();
      currentBlock = currentBlock.plus('1');
    }

    if (action === UserInfoAction.Stake) {
      userInfo.amount = new BigNumber(userInfo.amount).plus(amount).toString();
    } else if (action === UserInfoAction.UnStake) {
      userInfo.amount = new BigNumber(userInfo.amount).minus(amount).toString();
    }

    userInfo.last_block = blockNumber;
    userInfo.current_score_per_block = scorePerBlock.toString();
    userInfo.current_period = period.toString();

    const maxBlock = await this.chainInfoRepo.findOne({ id: 1 });
    const totalBlock = new BigNumber(maxBlock.max_block).minus(
      poolInfo.start_block,
    );
    const totalRw1 = totalBlock.times(poolInfo.reward_per_block_1);
    const totalRw2 = totalBlock.times(poolInfo.reward_per_block_2);
    userInfo.pending_reward_1 = totalRw1
      .times(userInfo.score)
      .div(poolInfo.total_score)
      .times(new BigNumber(10).pow(18))
      .toString();
    userInfo.pending_reward_2 = totalRw2
      .times(userInfo.score)
      .div(poolInfo.total_score)
      .times(new BigNumber(10).pow(18))
      .toString();

    await this.poolInfoRepo.save(poolInfo);
    return await this.userInfoRepo.save(userInfo);
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
      reward: userReward.map((data) => {
        delete data.signed_tx1;
        delete data.signed_tx2;
        delete data.note;
        return data;
      }),
      histories: userHistories,
    };
  }

  async claim(userAddress: string): Promise<UserInfoEntity[]> {
    if (!(await this.updateDataBeforeClaim(userAddress))) {
      throw new HttpException('User is invalid', 400);
    }
    const matcherAddress = getConfig().get<string>('matcher_address');
    const chainId = getConfig().get<number>('chain_id');
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
          nonce: this.web3.utils.toHex(count + 1),
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
    return dataReturn.map((data) => {
      delete data.signed_tx1;
      delete data.signed_tx2;
      delete data.note;
      return data;
    });
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
      if (item.last_block == maxBlock) continue;
      await this.updateLPRewards(
        item.pool_id,
        userAddress,
        UserInfoAction.Stake,
        new BigNumber(0),
        maxBlock,
      );
    }
    return true;
  }
}
