import { EntityRepository, Repository } from 'typeorm';
import { UserInfoEntity } from 'src/models/entities/user-info.entity';

@EntityRepository(UserInfoEntity)
export class UserInfoRepository extends Repository<UserInfoEntity> {
  async getUserInfo(
    poolId: number,
    userAddress: string,
  ): Promise<UserInfoEntity> {
    return this.findOne({
      where: {
        pool_id: poolId,
        user_address: userAddress,
      },
    });
  }
}
