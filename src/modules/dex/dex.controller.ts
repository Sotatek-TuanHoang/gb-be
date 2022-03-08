import { Controller, Get, Query } from '@nestjs/common';
import BigNumber from 'bignumber.js';
import { DexService } from 'src/modules/dex/dex.service';
import { StakeDto } from 'src/modules/dex/stake.dto';
import { UserInfoEntity } from 'src/models/entities/user-info.entity';

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

  @Get('claim')
  async claim(
    @Query() params: { user_address: string },
  ): Promise<UserInfoEntity[]> {
    return await this.dexService.claim(params.user_address);
  }
}
