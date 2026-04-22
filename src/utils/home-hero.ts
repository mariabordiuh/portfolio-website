import { HomeHeroSettings } from '../types';

export const DEFAULT_HOME_HERO_IMAGE = '/media/home-hero-coffee.jpg';
export const HOME_HERO_SETTINGS_ID = 'homeHero';

const trim = (value?: string) => value?.trim() || '';

export const DEFAULT_HOME_HERO_SETTINGS: HomeHeroSettings = {
  id: HOME_HERO_SETTINGS_ID,
  mode: 'image',
  flipHorizontal: false,
  flipPosterHorizontal: false,
  desktopImage: DEFAULT_HOME_HERO_IMAGE,
  mobileImage: '',
  desktopVideo: '',
  mobileVideo: '',
  posterImage: DEFAULT_HOME_HERO_IMAGE,
};

export const normalizeHomeHeroSettings = (
  settings?: Partial<HomeHeroSettings> & { id?: string },
): HomeHeroSettings => ({
  id: settings?.id || HOME_HERO_SETTINGS_ID,
  mode: settings?.mode === 'video' ? 'video' : 'image',
  flipHorizontal: Boolean(settings?.flipHorizontal),
  flipPosterHorizontal: Boolean(settings?.flipPosterHorizontal),
  desktopImage: trim(settings?.desktopImage) || DEFAULT_HOME_HERO_SETTINGS.desktopImage,
  mobileImage: trim(settings?.mobileImage),
  desktopVideo: trim(settings?.desktopVideo),
  mobileVideo: trim(settings?.mobileVideo),
  posterImage: trim(settings?.posterImage) || trim(settings?.desktopImage) || DEFAULT_HOME_HERO_SETTINGS.posterImage,
  createdAt: settings?.createdAt,
  updatedAt: settings?.updatedAt,
});
