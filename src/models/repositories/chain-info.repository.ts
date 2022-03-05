import { EntityRepository, Repository } from 'typeorm';
import { ChainInfoEntity } from 'src/models/entities/chain-info.entity';

@EntityRepository(ChainInfoEntity)
export class ChainInfoRepository extends Repository<ChainInfoEntity> {}
