'use client';

import { useEffect, useRef, useState } from 'react';
import { decode } from 'blurhash';

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  blurHash?: string | null;
  priority?: boolean;
};

export function CoverImage({ src, alt, width, height, blurHash, priority }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Draw blurhash canvas
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

  // Handle cached images: onLoad won't fire if already complete
  useEffect(() => {
    if (imgRef.current?.complete) {
      setImageLoaded(true);
    }
  }, [src]);

  const reveal = () => setImageLoaded(true);

  return (
    <>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        onLoad={reveal}
        onError={reveal}
        className="cover-image-img"
        loading={priority ? 'eager' : 'lazy'}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fetchPriority={priority ? 'high' : 'auto'}
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
