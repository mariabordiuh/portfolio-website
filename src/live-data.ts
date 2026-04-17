import { startTransition, useEffect, useState } from 'react';
import { labItems as fallbackLabItems, projects as fallbackProjects, videos as fallbackVideos } from './data';
import { GalleryImage, LabItem, Project, Video } from './types';

type LiveStatus = 'fallback' | 'connecting' | 'live';

type LivePortfolioState = {
  projects: Project[];
  videos: Video[];
  labItems: LabItem[];
  galleryImages: GalleryImage[];
  status: LiveStatus;
  errorMessage: string | null;
};

const initialState: LivePortfolioState = {
  projects: fallbackProjects,
  videos: fallbackVideos,
  labItems: fallbackLabItems,
  galleryImages: [],
  status: 'connecting',
  errorMessage: null,
};

export function useLivePortfolioData() {
  const [state, setState] = useState<LivePortfolioState>(initialState);

  useEffect(() => {
    let isActive = true;
    let cleanup = () => {};

    import('./live-data-client')
      .then(({ subscribeToLivePortfolioData }) => {
        if (!isActive) {
          return;
        }

        cleanup = subscribeToLivePortfolioData({
          onProjects: (projects) => {
            startTransition(() => {
              if (!isActive) {
                return;
              }

              setState((current) => ({
                ...current,
                projects: projects.length ? projects : current.projects,
                status: 'live',
                errorMessage: null,
              }));
            });
          },
          onVideos: (videos) => {
            startTransition(() => {
              if (!isActive) {
                return;
              }

              setState((current) => ({
                ...current,
                videos: videos.length ? videos : current.videos,
                status: 'live',
                errorMessage: null,
              }));
            });
          },
          onLabItems: (labItems) => {
            startTransition(() => {
              if (!isActive) {
                return;
              }

              setState((current) => ({
                ...current,
                labItems: labItems.length ? labItems : current.labItems,
                status: 'live',
                errorMessage: null,
              }));
            });
          },
          onGalleryImages: (galleryImages) => {
            startTransition(() => {
              if (!isActive) {
                return;
              }

              setState((current) => ({
                ...current,
                galleryImages,
                status: 'live',
                errorMessage: null,
              }));
            });
          },
          onError: (message) => {
            if (!isActive) {
              return;
            }

            setState((current) => ({
              ...current,
              status: current.status === 'live' ? 'live' : 'fallback',
              errorMessage: message,
            }));
          },
        });
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setState((current) => ({
          ...current,
          status: 'fallback',
          errorMessage: 'Live Firebase sync is unavailable right now. Showing the saved portfolio snapshot instead.',
        }));
      });

    return () => {
      isActive = false;
      cleanup();
    };
  }, []);

  return state;
}
