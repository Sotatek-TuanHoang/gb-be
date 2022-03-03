import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ethers } from 'ethers';

import { ABI } from 'src/shares/abis/router';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  @Cron('*/3 * * * * *')
  async handleCron() {
    console.log(3);
    const provider = new ethers.providers.JsonRpcProvider(
      'https://rpc.xinfin.network',
    );
    const contract = new ethers.Contract(
      'xdc90055EdC794e839567a5631d42752dB732E10C8F',
      ABI,
      provider,
    );
    const latestBlock = await provider.getBlockNumber();
    contract
      .queryFilter('Transfer', latestBlock - 1000, latestBlock)
      .then(async (events) => {
        if (events.length) {
          console.log('events', events);
        }
      })
      .catch((exception) => {
        console.log('exception', exception);
      });
  }
}
