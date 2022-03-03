import { Module, Logger } from '@nestjs/common';
import Modules from 'src/modules';
import { TasksService } from './models/repositories/index';

@Module({
  imports: [...Modules],
  controllers: [],
  providers: [Logger, TasksService],
})
export class AppModule {}
