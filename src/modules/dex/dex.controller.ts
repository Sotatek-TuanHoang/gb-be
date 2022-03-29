import { Controller, Get, Query } from '@nestjs/common';
import BigNumber from 'bignumber.js';
import { DexService } from 'src/modules/dex/dex.service';
import { StakeDto, UserDataDto } from 'src/modules/dex/stake.dto';
import { UserInfoEntity } from 'src/models/entities/user-info.entity';
import { UserInfoAction } from './dex.const';

@Controller('dex')
export class DexController {
  constructor(private dexService: DexService) {}
  @Get('/stake')
  async stake(@Query() params: StakeDto): Promise<boolean> {
    await this.dexService.updateLPRewards(
      params.poolId,
      params.userAddress,
      UserInfoAction.Stake,
      new BigNumber(params.amount),
      params.blockNumber,
    );
    return true;
  }

  @Get('/end')
  async noAction(@Query() params: StakeDto): Promise<boolean> {
    await this.dexService.updateLPRewards(
      params.poolId,
      params.userAddress,
      UserInfoAction.EndBlock,
      new BigNumber(params.amount),
      params.blockNumber,
    );
    return true;
  }

  @Get('/unstake')
  async unstake(@Query() params: StakeDto): Promise<boolean> {
    await this.dexService.updateLPRewards(
      params.poolId,
      params.userAddress,
      UserInfoAction.UnStake,
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

  @Get('/user-data')
  async getUserData(@Query() params: UserDataDto): Promise<any> {
    const data = await this.dexService.getDataUser(params.userAddress);
    return data;
  }
}
