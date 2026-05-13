'use client';

import { useEffect, useRef, useState } from 'react';
import { decode } from 'blurhash';

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  blurHash?: string | null;
};

export function CoverImage({ src, alt, width, height, blurHash }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!blurHash || !canvas) return;

    const W = 32;
    const H = Math.round(32 * (height / width));
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixels = decode(blurHash, W, H);
    const imageData = ctx.createImageData(W, H);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
  }, [blurHash, width, height]);

  return (
    <>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        onLoad={() => setImageLoaded(true)}
        className="cover-image-img"
        style={{ opacity: imageLoaded || !blurHash ? 1 : 0 }}
      />
      {blurHash && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="cover-image-blur"
          style={{ opacity: imageLoaded ? 0 : 1 }}
        />
      )}
    </>
  );
}
