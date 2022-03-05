import { EntityRepository, Repository } from 'typeorm';
import { UserHistoryEntity } from 'src/models/entities/user-history.entity';

@EntityRepository(UserHistoryEntity)
export class UserHistoryRepository extends Repository<UserHistoryEntity> {}
