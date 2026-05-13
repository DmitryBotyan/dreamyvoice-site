import sharp from 'sharp';
import { encode } from 'blurhash';
import { prisma } from '../dist/prisma';
import { getObject } from '../dist/services/storage';

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
  }
  return Buffer.concat(chunks);
}

async function computeBlurHash(buffer: Buffer): Promise<string> {
  const { data, info } = await sharp(buffer)
    .resize(32, 32, { fit: 'cover', withoutEnlargement: false })
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3);
}

async function main() {
  const titles = await prisma.title.findMany({
    where: { coverKey: { not: null }, coverBlurHash: null },
    select: { id: true, slug: true, coverKey: true },
  });

  console.log(`Titles to backfill: ${titles.length}`);
  if (titles.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  let ok = 0;
  let fail = 0;

  for (const title of titles) {
    try {
      const obj = await getObject('covers', title.coverKey!);
      const buffer = await streamToBuffer(obj.body);
      const blurHash = await computeBlurHash(buffer);

      await prisma.title.update({
        where: { id: title.id },
        data: { coverBlurHash: blurHash },
      });

      console.log(`✓ ${title.slug}: ${blurHash}`);
      ok++;
    } catch (err) {
      console.error(`✗ ${title.slug}:`, err instanceof Error ? err.message : err);
      fail++;
    }
  }

  console.log(`\nDone: ${ok} updated, ${fail} failed.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
