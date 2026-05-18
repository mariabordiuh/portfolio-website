import { useEffect, useRef } from 'react';
import type { NeatConfig, NeatGradient as NeatGradientInstance } from '@firecms/neat';

const neatHeroConfig: NeatConfig = {
  colors: [
    {
      color: '#FF5770',
      enabled: true,
      influence: 1,
    },
    {
      color: '#FF7690',
      enabled: true,
      influence: 0.82,
    },
    {
      color: '#FF9FB1',
      enabled: true,
      influence: 0.58,
    },
    {
      color: '#FFD8E0',
      enabled: true,
      influence: 0.28,
    },
    {
      color: '#F5E1E5',
      enabled: false,
    },
  ],
  speed: 6,
  horizontalPressure: 7,
  verticalPressure: 8,
  waveFrequencyX: 1,
  waveFrequencyY: 2,
  waveAmplitude: 8,
  shadows: 2,
  highlights: 7,
  colorBrightness: 1.02,
  colorSaturation: 1,
  wireframe: false,
  colorBlending: 9,
  backgroundColor: '#06060A',
  backgroundAlpha: 1,
  grainScale: 4,
  grainSparsity: 0,
  grainIntensity: 0.16,
  grainSpeed: 1,
  resolution: 1,
  yOffset: 0,
  yOffsetWaveMultiplier: 6.2,
  yOffsetColorMultiplier: 5.8,
  yOffsetFlowMultiplier: 6.5,
  flowDistortionA: 1.1,
  flowDistortionB: 0.8,
  flowScale: 1.6,
  flowEase: 0.32,
  flowEnabled: true,
  enableProceduralTexture: false,
  textureVoidLikelihood: 0.27,
  textureVoidWidthMin: 60,
  textureVoidWidthMax: 420,
  textureBandDensity: 1.2,
  textureColorBlending: 0.06,
  textureSeed: 333,
  textureEase: 0.22,
  proceduralBackgroundColor: '#08060A',
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
        resolution: isMobile ? 0.72 : 0.96,
      });

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
