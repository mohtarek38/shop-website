import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { MediaAsset } from '@shop/contracts';
import { type AuthContext, CurrentAuth, RequirePermission } from '../identity/index.js';
import { MAX_IMAGE_BYTES } from './image-processor.js';
import { MediaService, type UploadedFile as File } from './media.service.js';

@ApiTags('admin: media')
@Controller('admin/media')
export class MediaAdminController {
  constructor(private readonly media: MediaService) {}

  /** Upload one product image (JPEG, PNG, WebP or AVIF, up to 10 MB, at least 300px). */
  @Post('images')
  @RequirePermission('catalog.write')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  @UseInterceptors(
    // Slightly above the limit so oversized files get our 400 rather than multer's 413.
    FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES + 1, files: 1 } }),
  )
  upload(
    @UploadedFile() file: File | undefined,
    @CurrentAuth() auth: AuthContext,
  ): Promise<MediaAsset> {
    return this.media.uploadImage(file, auth.user.id);
  }
}
