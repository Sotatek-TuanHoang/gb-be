import { EntityRepository, In, Repository } from 'typeorm';
import {
  UserInfoEntity,
  UserInfoStatus,
} from 'src/models/entities/user-info.entity';

@EntityRepository(UserInfoEntity)
export class UserInfoRepository extends Repository<UserInfoEntity> {
  async getUserInfoV2(
    poolId: number,
    userAddress: string,
  ): Promise<UserInfoEntity> {
    return await this.findOne({
      where: {
        pool_id: poolId,
        user_address: userAddress,
      },
    });
  }

  async getDataClaimByUserAddress(
    userAddress: string,
  ): Promise<UserInfoEntity[]> {
    return await this.find({
      where: {
        user_address: userAddress,
        status: In([UserInfoStatus.Pending, UserInfoStatus.End]),
      },
    });
  }

  async getOneDataClaimProcess(): Promise<UserInfoEntity> {
    return await this.findOne({
      where: {
        status: UserInfoStatus.Claim,
      },
    });
  }
}
