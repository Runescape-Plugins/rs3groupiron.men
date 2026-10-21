import {
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { parseAdminGroupsQuery } from './admin.types';

@Controller('admin')
@UseGuards(ThrottlerGuard, AdminGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('ping')
  @Header('Cache-Control', 'no-store')
  ping() {
    return { ok: true };
  }

  @Get('overview')
  @Header('Cache-Control', 'no-store')
  overview(@Query('days') days?: string) {
    return this.admin.overview(days);
  }

  @Get('groups')
  @Header('Cache-Control', 'no-store')
  groups(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
    @Query('sort') sort?: string,
    @Query('dir') dir?: string,
    @Query('filter') filter?: string,
  ) {
    return this.admin.listGroups(
      parseAdminGroupsQuery({
        q,
        page,
        page_size: pageSize,
        sort,
        dir,
        filter,
      }),
    );
  }

  @Delete('groups/:id')
  @HttpCode(200)
  deleteGroup(@Param('id') id: string) {
    return this.admin.deleteGroup(id);
  }

  @Post('groups/:id/schedule-deletion')
  @HttpCode(200)
  scheduleDeletion(@Param('id') id: string) {
    return this.admin.scheduleDeletion(id);
  }

  @Post('groups/:id/cancel-deletion')
  @HttpCode(200)
  cancelDeletion(@Param('id') id: string) {
    return this.admin.cancelDeletion(id);
  }
}
