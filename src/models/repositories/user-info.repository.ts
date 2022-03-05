import { EntityRepository, Repository } from 'typeorm';
import { UserInfoEntity } from 'src/models/entities/user-info.entity';

@EntityRepository(UserInfoEntity)
export class UserInfoRepository extends Repository<UserInfoEntity> {}
