import { Module } from '@nestjs/common';
import { DatabaseCommonRepository } from 'src/models/repositories/repository';
import { SeederConsole } from 'src/modules/seeder/seeder.console';

@Module({
  imports: [DatabaseCommonRepository],
  controllers: [],
  providers: [SeederConsole],
  exports: [],
})
export class SeederModule {}
