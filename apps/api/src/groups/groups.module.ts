import { Module } from '@nestjs/common';
import { R2Module } from '../uploads/r2.module';
import { GroupAccessService } from './group-access.service';
import { GroupEventsService } from './group-events.service';
import { GroupExportService } from './group-export.service';
import { GroupPurgeService } from './group-purge.service';
import { GroupsSeedService } from './groups-seed.service';
import {
  GroupsAuthedController,
  GroupsPublicController,
} from './groups.controller';
import { GroupsService } from './groups.service';
import { XpHistoryService } from './xp-history.service';

@Module({
  imports: [R2Module],
  controllers: [GroupsPublicController, GroupsAuthedController],
  providers: [
    GroupAccessService,
    GroupsService,
    GroupsSeedService,
    GroupExportService,
    GroupPurgeService,
    XpHistoryService,
    GroupEventsService,
  ],
  // GroupAccessService rather than GroupsService: the uploads module needs a
  // permission check, not the write paths.
  exports: [GroupAccessService, GroupEventsService],
})
export class GroupsModule {}
