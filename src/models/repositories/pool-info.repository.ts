import { EntityRepository, Repository } from 'typeorm';
import { PoolInfoEntity } from 'src/models/entities/pool-info.entity';

@EntityRepository(PoolInfoEntity)
export class PoolInfoRepository extends Repository<PoolInfoEntity> {
  async getPoolInfo(poolId: number): Promise<PoolInfoEntity> {
    return this.findOne({ id: poolId });
  }
}
