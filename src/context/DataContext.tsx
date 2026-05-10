import { createContext, useContext } from 'react';
import { GalleryImage, HomeHeroSettings, LabItem, Project, Video } from '../types';
import { DEFAULT_HOME_HERO_SETTINGS } from '../utils/home-hero';

export interface DataContextType {
  projects: Project[];
  videos: Video[];
  labItems: LabItem[];
  galleryImages: GalleryImage[];
  homeHero: HomeHeroSettings;
  homeHeroReady: boolean;
  loading: boolean;
}

export const DataContext = createContext<DataContextType>({
  projects: [],
  videos: [],
  labItems: [],
  galleryImages: [],
  homeHero: DEFAULT_HOME_HERO_SETTINGS,
  homeHeroReady: false,
  loading: true,
});

export const useData = () => useContext(DataContext);
