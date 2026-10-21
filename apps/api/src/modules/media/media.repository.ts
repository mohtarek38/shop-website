import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../shared/database/prisma.service.js';

export type MediaRow = Prisma.MediaGetPayload<object>;

/** The only code that queries the media table (ADR-0002). */
@Injectable()
export class MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.MediaUncheckedCreateInput): Promise<MediaRow> {
    return this.prisma.media.create({ data });
  }

  findByIds(ids: string[]): Promise<MediaRow[]> {
    return this.prisma.media.findMany({ where: { id: { in: ids } } });
  }
}
