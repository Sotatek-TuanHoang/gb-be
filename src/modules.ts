import { Logger } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsoleModule } from 'nestjs-console';
import { defaultConfig } from 'src/configs/database.config';
import { DexModule } from 'src/modules/dex/dex.module';
import { SeederModule } from 'src/modules/seeder/seeder.module';

const Modules = [
  Logger,
  ScheduleModule.forRoot(),
  TypeOrmModule.forRoot(defaultConfig),
  ConsoleModule,
  DexModule,
  SeederModule,
];

export default Modules;
