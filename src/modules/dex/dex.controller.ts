import { Controller, Get, Query } from '@nestjs/common';
import BigNumber from 'bignumber.js';
import { DexService } from 'src/modules/dex/dex.service';

@Controller('dex')
export class DexController {
  constructor(private dexService: DexService) {}
  @Get('/stake')
  async stake(): Promise<boolean> {
    await this.dexService.stake(1, 'axaa', new BigNumber(100), '2000');
    return true;
  }
}
