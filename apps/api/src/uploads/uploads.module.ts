import { Module } from '@nestjs/common';
import { GroupsModule } from '../groups/groups.module';
import { R2Module } from './r2.module';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [GroupsModule, R2Module],
  controllers: [UploadsController],
  exports: [R2Module],
})
export class UploadsModule {}
