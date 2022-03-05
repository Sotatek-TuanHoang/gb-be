import { Logger } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsoleModule } from 'nestjs-console';
import { defaultConfig } from 'src/configs/database.config';
import { DexModule } from 'src/modules/dex/dex.module';

const Modules = [
  Logger,
  ScheduleModule.forRoot(),
  TypeOrmModule.forRoot(defaultConfig),
  ConsoleModule,
  DexModule,
];

export default Modules;
