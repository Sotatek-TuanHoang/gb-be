// eslint-disable-next-line
const Web3 = require('xdc3');
import * as EthereumTx from 'ethereumjs-tx';
import { UserInfoStatus } from '../../models/entities/user-info.entity';
import { Command, Console } from 'nestjs-console';
import { Injectable, Logger } from '@nestjs/common';
import { crawlByMethodName, sleep } from 'src/shares/helpers/crawler';
import { ChainInfoRepository } from '../../models/repositories/chain-info.repository';
import { MethodName } from '../../shares/enums/method-name.enum';
import { DexService } from './dex.service';
import { getConfig } from 'src/configs/index';
import { PoolInfoRepository } from '../../models/repositories/pool-info.repository';
import { UserInfoRepository } from 'src/models/repositories/user-info.repository';
import { UserHistoryRepository } from '../../models/repositories/user-history.repository';

@Console()
@Injectable()
export class DexConsole {
  private web3;

  constructor(
    private readonly chainInfoRepository: ChainInfoRepository,
    private readonly poolInfoRepository: PoolInfoRepository,
    private readonly userHistoryRepository: UserHistoryRepository,
    private readonly userInfoRepository: UserInfoRepository,
    private readonly dexService: DexService,
    private readonly logger: Logger,
  ) {
    this.logger.setContext(DexConsole.name);
    const xinFinRpc = getConfig().get<string>('xin_fin_rpc');
    this.web3 = new Web3();
    this.web3.setProvider(new Web3.providers.HttpProvider(xinFinRpc));
  }

  @Command({
    command: 'crawl-dex',
    description: 'Crawl event',
  })
  async handle(): Promise<void> {
    this.web3.setProvider(
      new Web3.providers.HttpProvider('https://rpc.xinfin.network/'),
    );
    const { address } = getConfig();

    const eventHandler = async (methodInfo): Promise<void> => {
      const {
        method,
        blockNumber,
        from,
        poolAddress,
        amount,
        tx_hash,
      } = methodInfo;

      const poolInfos = await this.poolInfoRepository.findOne({
        lp_token: poolAddress,
      });

      await this.userHistoryRepository.insert({
        pool_id: poolInfos?.id || 0,
        pool_address: poolAddress,
        last_block: blockNumber,
        user_address: from,
        tx_hash: tx_hash,
        action: method,
        amount,
      });

      if (!poolInfos) return;

      switch (method) {
        case MethodName.ADD_LIQUIDITY:
        case MethodName.ADD_LIQUIDITY_ETH:
          await this.dexService.stake(poolInfos.id, from, amount, blockNumber);
          break;
        case MethodName.REMOVE_LIQUIDITY:
        case MethodName.REMOVE_LIQUIDITY_ETH:
          await this.dexService.unstake(
            poolInfos.id,
            from,
            amount,
            blockNumber,
          );
          break;
        default:
          break;
      }
    };

    await crawlByMethodName(
      this.web3,
      this.chainInfoRepository,
      eventHandler,
      address.routerAddress,
    );
  }

  @Command({
    command: 'claim-reward',
    description: 'Claim Reward',
  })
  async claimReward(): Promise<void> {
    const matcherPrivateKey = getConfig().get<string>('matcher_private_key');
    const privateKey = Buffer.from(matcherPrivateKey, 'hex');
    while (true) {
      const userInfoClaim = await this.userInfoRepository.getOneDataClaimProcess();
      if (!userInfoClaim) {
        await sleep(3000);
        this.logger.log('Waiting for next user info claim data');
        continue;
      }
      const tx1 = new EthereumTx(userInfoClaim.signed_tx1);
      const tx2 = new EthereumTx(userInfoClaim.signed_tx2);
      tx1.sign(privateKey);
      tx2.sign(privateKey);
      userInfoClaim.txid1 = `0x${tx1.hash().toString('hex')}`;
      userInfoClaim.txid2 = `0x${tx2.hash().toString('hex')}`;
      userInfoClaim.signed_tx1 = tx1.serialize().toString('hex');
      userInfoClaim.signed_tx2 = tx2.serialize().toString('hex');
      const receipt1 = await this.web3.eth.sendSignedTransaction(
        `0x${userInfoClaim.signed_tx1}`,
      );
      const receipt2 = await this.web3.eth.sendSignedTransaction(
        `0x${userInfoClaim.signed_tx2}`,
      );
      userInfoClaim.status =
        receipt1 && receipt2 ? UserInfoStatus.Complete : UserInfoStatus.Failed;
      await this.userInfoRepository.save(userInfoClaim);
    }
  }
}
