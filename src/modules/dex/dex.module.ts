import { Module } from '@nestjs/common';
import { DatabaseCommonRepository } from 'src/models/repositories/repository';
import { DexController } from 'src/modules/dex/dex.controller';
import { DexService } from 'src/modules/dex/dex.service';

@Module({
  imports: [DatabaseCommonRepository],
  controllers: [DexController],
  providers: [DexService],
  exports: [DexService],
})
export class DexModule {}
