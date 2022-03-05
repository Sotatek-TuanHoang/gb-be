// eslint-disable-next-line
const Web3 = require('web3');
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ethers } from 'ethers';

import ABI from 'src/shares/abis/router';
import { Command, Console } from 'nestjs-console';
import ABI_J from 'src/shares/abis/router.json';

@Console()
@Injectable()
export class OrdersConsole {
  private web3;

  constructor(
    // private readonly ordersService: OrdersService,
    // private readonly latestBlockService: LatestBlockService,
    // private readonly offerService: OfferService,
    // private readonly pairService: PairService,
    private readonly logger: Logger, // @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.logger.setContext(OrdersConsole.name);
    // const rpcUrl = getConfig().get<string>('rpc_url');
    this.web3 = new Web3('https://rpc.xinfin.network/');
    this.web3.setProvider(
      new Web3.providers.HttpProvider('https://rpc.xinfin.network/'),
    );
  }
  // private readonly logger = new Logger(TasksService.name);

  // @Cron('*/3 * * * * *')
  // async handleCron() {
  //   const provider = new ethers.providers.JsonRpcProvider(
  //     'https://rpc.xinfin.network/',
  //   );
  //   // const web3 = new Web3('https://rpc.xinfin.network/');
  //   // const contract_1 = new web3.eth.Contract(
  //   //   ABI_J as any,
  //   //   'xdc90055EdC794e839567a5631d42752dB732E10C8F',
  //   // );

  //   // console.log('contract_1 -===> ', contract_1);

  //   const contract = new ethers.Contract(
  //     'xdc90055EdC794e839567a5631d42752dB732E10C8F',
  //     ABI,
  //     provider,
  //   );

  //   const latestBlock = await provider.getBlockNumber();
  //   console.log('latestBlock ===> ', latestBlock);
  //   const eventFilter = contract.filters.Transfer();
  //   // const eventFilter = await contract.getTransactionFromBlock(
  //   //   latestBlock - 1000,
  //   //   latestBlock,
  //   // );

  //   // console.log('eventFilter', eventFilter);
  //   // console.log('contract', contract.filters);

  //   let block = 42066896;
  //   while (block >= 42066796) {
  //     const events = await contract.queryFilter(
  //       eventFilter,
  //       42066896 - 100,
  //       42066896,
  //     );
  //     block--;

  //     console.log('events', events);
  //   }
  // }

  @Command({
    command: 'activate-orders',
  })
  async activateOrders(): Promise<void> {
    // this.producer = kafka.producer();
    // await this.producer.connect();

    const contract = new this.web3.eth.Contract(
      ABI,
      'xdc90055EdC794e839567a5631d42752dB732E10C8F',
    );

    console.log('contract ====> ');
    // const eventHandler = async (event): Promise<void> => {
    //   this.logger.log(`Processing event ${JSON.stringify(event)}`);
    //   this.logger.log(`Handle order with hash ${event.returnValues.orderHash}`);

    //   console.log('event ==> ', event);
    // const data = await this.ordersService.getOrderByHash(
    //   event.returnValues.orderHash,
    // );
    // if (!data)
    //   this.logger.log(
    //     `Cannot find order with hash ${event.returnValues.orderHash}`,
    //   );
    // else await this.activeOrder(data);
    // };
    // await crawlBscEvents(
    //   this.web3,
    //   // this.latestBlockService,
    //   contract,
    //   // ContractEvent.LockedBalanceOrder,
    //   eventHandler,
    // );
  }

  async crawlBscEvents(
    // eslint-disable-next-line
    web3: any,
    // latestBlockService: LatestBlockService,
    // eslint-disable-next-line
    contract: any,
    // eventName: string,
    callback: (event) => void,
  ): Promise<void> {
    // let cursor = 0;
    // const latestBlock = await latestBlockService.getLatestBlock(
    //   LatestBlockCoin.bsc,
    //   eventName,
    // );
    // if (latestBlock.block) cursor = Number(latestBlock.block);
    // while (true) {
    //   const to = Math.min(
    //     cursor + BSC_STEP_BLOCK,
    //     await web3.eth.getBlockNumber(),
    //   );
    //   const params = { fromBlock: cursor + 1, toBlock: to };
    //   const events = await contract.getPastEvents(eventName, params);
    //   for (const event of events) {
    //     callback(event);
    //   }
    //   cursor = to;
    //   await latestBlockService.saveLatestBlock(
    //     LatestBlockCoin.bsc,
    //     eventName,
    //     to.toString(),
    //   );
    //   await sleep(BSC_BLOCK_TIME);
    // }
  }
}
