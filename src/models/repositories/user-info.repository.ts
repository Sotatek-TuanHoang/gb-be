import { EntityRepository, Repository } from 'typeorm';
import { UserInfoEntity } from 'src/models/entities/user-info.entity';

@EntityRepository(UserInfoEntity)
export class UserInfoRepository extends Repository<UserInfoEntity> {
  async getUserInfo(
    poolId: number,
    userAddress: string,
  ): Promise<UserInfoEntity> {
    const userInfo = await this.findOne({
      where: {
        pool_id: poolId,
        user_address: userAddress,
      },
    });

    if (userInfo) {
      return userInfo;
    }

    const empty: UserInfoEntity = {
      user_address: userAddress,
      pool_id: poolId,
      reward_debt_1: '0',
      reward_debt_2: '0',
      pending_reward_1: '0',
      pending_reward_2: '0',
      last_block: '0',
      amount: '0',
      score: '0',
      created_at: new Date(),
      updated_at: new Date(),
    };
    return empty;
  }
}
