import { EntityRepository, Repository } from 'typeorm';
import { PoolInfoEntity } from 'src/models/entities/pool-info.entity';

@EntityRepository(PoolInfoEntity)
export class PoolInfoRepository extends Repository<PoolInfoEntity> {
  async getPoolInfo(poolId: number): Promise<PoolInfoEntity> {
    const poolInfo = await this.findOne({ id: poolId });
    const result = poolInfo ? poolInfo : new PoolInfoEntity();
    return result;
  }
}
