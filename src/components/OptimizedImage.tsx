import { useState, useRef, useEffect, memo } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  placeholder?: string;
}

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  sizes,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22%23f1f5f9%22 width=%22400%22 height=%22300%22/%3E%3C/svg%3E',
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(loading === 'eager');
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (loading === 'eager') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [loading]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      <img
        ref={imgRef}
        src={isInView && !hasError ? src : placeholder}
        alt={alt}
        className={`transition-opacity duration-300 ${isLoaded || !isInView ? 'opacity-100' : 'opacity-0'} ${className}`}
        width={width}
        height={height}
        loading={loading}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        decoding="async"
      />
      {!isLoaded && isInView && !hasError && (
        <div className="absolute inset-0 bg-slate-100 animate-pulse" />
      )}
      {hasError && (
        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
          Image unavailable
        </div>
      )}
    </div>
  );
});

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export const ProductImage = memo(function ProductImage({
  src,
  alt,
  className = '',
  priority = false,
}: ProductImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    />
  );
});

interface HeroImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const HeroImage = memo(function HeroImage({
  src,
  alt,
  className = '',
}: HeroImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      loading="eager"
      sizes="100vw"
      placeholder="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1920 1080%22%3E%3Crect fill=%22%231e293b%22 width=%221920%22 height=%221080%22/%3E%3C/svg%3E"
    />
  );
});
