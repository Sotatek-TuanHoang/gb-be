import { Controller, Get, Query } from '@nestjs/common';
import BigNumber from 'bignumber.js';
import { DexService } from 'src/modules/dex/dex.service';
import { StakeDto } from 'src/modules/dex/stake.dto';

@Controller('dex')
export class DexController {
  constructor(private dexService: DexService) {}
  @Get('/stake')
  async stake(@Query() params: StakeDto): Promise<boolean> {
    await this.dexService.stake(
      params.poolId,
      params.userAddress,
      new BigNumber(params.amount),
      params.blockNumber,
    );
    return true;
  }

  @Get('/unstake')
  async unstake(@Query() params: StakeDto): Promise<boolean> {
    await this.dexService.unstake(
      params.poolId,
      params.userAddress,
      new BigNumber(params.amount),
      params.blockNumber,
    );
    return true;
  }
}
