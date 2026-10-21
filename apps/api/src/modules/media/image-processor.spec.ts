import sharp from 'sharp';
import { InvalidImageError, processImage } from './image-processor.js';

const png = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: '#0F6E64' } })
    .png()
    .toBuffer();

describe('processImage', () => {
  it('produces WebP sizes that keep the aspect ratio and never enlarge', async () => {
    const result = await processImage(await png(1600, 800));
    expect(result).toMatchObject({ width: 1600, height: 800, format: 'png' });

    const lg = await sharp(result.sizes.lg).metadata();
    const thumb = await sharp(result.sizes.thumb).metadata();
    expect(lg).toMatchObject({ format: 'webp', width: 1200, height: 600 });
    expect(thumb).toMatchObject({ width: 200, height: 100 });

    const small = await processImage(await png(400, 400));
    expect((await sharp(small.sizes.lg).metadata()).width).toBe(400); // not enlarged
  });

  it('rejects images that are too small or not images at all', async () => {
    await expect(processImage(await png(200, 150))).rejects.toThrow(InvalidImageError);
    await expect(processImage(Buffer.from('<svg></svg>'))).rejects.toMatchObject({
      code: 'unsupported_image',
    });
  });
});
