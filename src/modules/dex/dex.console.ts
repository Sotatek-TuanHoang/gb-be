// eslint-disable-next-line
const Web3 = require('xdc3');
import { Command, Console } from 'nestjs-console';
import { Injectable } from '@nestjs/common';
import { crawlByMethodName } from 'src/shares/helpers/crawler';
import { ChainInfoRepository } from '../../models/repositories/chain-info.repository';
import { MethodName } from '../../shares/enums/method-name.enum';
import { DexService } from './dex.service';
import { getConfig } from 'src/configs/index';
import { PoolInfoRepository } from '../../models/repositories/pool-info.repository';

@Console()
@Injectable()
export class DexConsole {
  private web3;

  constructor(
    private readonly chainInfoRepository: ChainInfoRepository,
    private readonly poolInfoRepository: PoolInfoRepository,
    private readonly dexService: DexService,
  ) {
    this.web3 = new Web3();
    this.web3.setProvider(
      new Web3.providers.HttpProvider('https://rpc.xinfin.network'),
    );
  }

  @Command({
    command: 'crawl-dex',
    description: 'Crawl event',
  })
  async handle(): Promise<void> {
    const { address } = getConfig();

    const eventHandler = async (methodInfo): Promise<void> => {
      const { method, blockNumber, from, poolAddress, amount } = methodInfo;
      const poolInfos = await this.poolInfoRepository.findOne({
        lp_token: poolAddress,
      });

      switch (method) {
        case MethodName.ADD_LIQUIDITY:
          this.dexService.stake(poolInfos.id, from, amount, blockNumber);
          break;
        case MethodName.REMOVE_LIQUIDITY:
          this.dexService.unstake(poolInfos.id, from, amount, blockNumber);
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
}
