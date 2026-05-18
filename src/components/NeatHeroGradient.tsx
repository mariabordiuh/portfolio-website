import { useEffect, useRef } from 'react';
import type { NeatConfig, NeatGradient as NeatGradientInstance } from '@firecms/neat';

const neatHeroConfig: NeatConfig = {
  colors: [
    {
      color: '#0A0A0A',
      enabled: true,
    },
    {
      color: '#FF5772',
      enabled: true,
    },
    {
      color: '#FF6F8F',
      enabled: true,
    },
    {
      color: '#FF8FAA',
      enabled: true,
    },
    {
      color: '#FFADC0',
      enabled: true,
    },
    {
      color: '#F5D6DE',
      enabled: true,
    },
  ],
  speed: 4.1,
  horizontalPressure: 3,
  verticalPressure: 4,
  waveFrequencyX: 2,
  waveFrequencyY: 3,
  waveAmplitude: 5,
  shadows: 1,
  highlights: 5,
  colorBrightness: 1,
  colorSaturation: 7,
  wireframe: false,
  colorBlending: 8,
  backgroundColor: '#0A0A0A',
  backgroundAlpha: 1,
  grainScale: 0,
  grainSparsity: 0,
  grainIntensity: 0,
  grainSpeed: 1,
  resolution: 1,
  yOffset: 0,
  yOffsetWaveMultiplier: 4,
  yOffsetColorMultiplier: 4,
  yOffsetFlowMultiplier: 4,
  flowDistortionA: 0,
  flowDistortionB: 0,
  flowScale: 1,
  flowEase: 0,
  flowEnabled: true,
  enableProceduralTexture: false,
  textureVoidLikelihood: 0.45,
  textureVoidWidthMin: 200,
  textureVoidWidthMax: 486,
  textureBandDensity: 2.15,
  textureColorBlending: 0.01,
  textureSeed: 333,
  textureEase: 0.5,
  proceduralBackgroundColor: '#000000',
  textureShapeTriangles: 20,
  textureShapeCircles: 15,
  textureShapeBars: 15,
  textureShapeSquiggles: 10,
  domainWarpEnabled: false,
  domainWarpIntensity: 0,
  domainWarpScale: 3,
  vignetteIntensity: 0,
  vignetteRadius: 0.8,
  fresnelEnabled: false,
  fresnelPower: 2,
  fresnelIntensity: 0.5,
  fresnelColor: '#FFFFFF',
  iridescenceEnabled: false,
  iridescenceIntensity: 0.5,
  iridescenceSpeed: 1,
  bloomIntensity: 0,
  bloomThreshold: 0.7,
  chromaticAberration: 0,
};

export const NeatHeroGradient = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    let gradient: NeatGradientInstance | null = null;
    let disposed = false;
    let scrollFrame = 0;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 767px)').matches;

    const syncScrollOffset = () => {
      scrollFrame = 0;
      if (gradient) {
        gradient.yOffset = window.scrollY;
      }
    };

    const handleScroll = () => {
      if (scrollFrame) {
        return;
      }

      scrollFrame = window.requestAnimationFrame(syncScrollOffset);
    };

    const init = async () => {
      const { NeatGradient } = await import('@firecms/neat');
      if (!canvasRef.current || disposed) {
        return;
      }

      gradient = new NeatGradient({
        ref: canvasRef.current,
        ...neatHeroConfig,
        speed: prefersReducedMotion ? 0 : neatHeroConfig.speed,
        resolution: isMobile ? 0.82 : 1,
      });

      canvasRef.current.parentElement?.querySelector('a[data-n]')?.remove();

      syncScrollOffset();
      window.addEventListener('scroll', handleScroll, { passive: true });
    };

    void init();

    return () => {
      disposed = true;
      window.removeEventListener('scroll', handleScroll);

      if (scrollFrame) {
        window.cancelAnimationFrame(scrollFrame);
      }

      gradient?.destroy();
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ isolation: 'isolate' }}
      />
    </div>
  );
};
