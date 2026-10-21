/** An uploaded image as the API returns it (ADR-0018). */
export interface MediaAsset {
  id: string;
  width: number | null;
  height: number | null;
  /** WebP sizes (longest side 200/600/1200px) and the original upload. */
  urls: { thumb: string; md: string; lg: string; original: string };
}

export const IMAGE_SIZE_PX = { thumb: 200, md: 600, lg: 1200 } as const;
