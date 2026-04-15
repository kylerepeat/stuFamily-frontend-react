import React, { useEffect, useMemo, useState } from 'react';

interface CarouselProps {
  initialImages?: string[];
}

const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675' viewBox='0 0 1200 675'>" +
      "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
      "<stop offset='0%' stop-color='#f59e0b'/><stop offset='100%' stop-color='#f97316'/>" +
      "</linearGradient></defs>" +
      "<rect width='1200' height='675' fill='url(#g)'/>" +
      "<text x='600' y='320' text-anchor='middle' font-size='54' fill='white' font-family='Arial, sans-serif'>学子之家</text>" +
      "<text x='600' y='385' text-anchor='middle' font-size='28' fill='white' font-family='Arial, sans-serif'>轮播图加载中</text>" +
      "</svg>"
  );

const normalizeImages = (input: string[] | undefined): string[] => {
  const source = Array.isArray(input) ? input : [];
  const cleaned = source
    .filter((url) => typeof url === 'string')
    .map((url) => url.trim())
    .filter((url) => url.length > 0);
  return cleaned.length > 0 ? cleaned : [FALLBACK_IMAGE];
};

const Carousel = ({ initialImages = [] }: CarouselProps) => {
  const [images, setImages] = useState<string[]>(() => normalizeImages(initialImages));
  const [currentIndex, setCurrentIndex] = useState(0);
  const imageSignature = useMemo(() => initialImages.join('|'), [initialImages]);

  useEffect(() => {
    setImages(normalizeImages(initialImages));
    setCurrentIndex(0);
  }, [imageSignature]);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  useEffect(() => {
    if (currentIndex >= images.length) {
      setCurrentIndex(0);
    }
  }, [currentIndex, images.length]);

  return (
    <section className="relative group">
      <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-lg relative bg-surface-container">
        <div
          className="flex h-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((img, idx) => (
            <img
              key={`${img}-${idx}`}
              alt="Promotion Banner"
              className="w-full h-full object-cover shrink-0 basis-full"
              src={img}
              referrerPolicy="no-referrer"
              onError={() => {
                setImages((prev) => {
                  if (!prev[idx] || prev[idx] === FALLBACK_IMAGE) return prev;
                  const next = [...prev];
                  next[idx] = FALLBACK_IMAGE;
                  return next;
                });
              }}
            />
          ))}
        </div>
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
      </div>
      
      {/* Indicators */}
      <div className="flex justify-center mt-4 space-x-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentIndex ? 'w-6 bg-primary' : 'w-1.5 bg-outline-variant opacity-40'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default React.memo(Carousel);
