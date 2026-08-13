import {useEffect, useState} from 'react';
import {probeBrowserDeviceProfile, type PoietekDeviceRuntimeProfile} from '../deployment';

const mediaQueries = [
  '(pointer: coarse)',
  '(pointer: fine)',
  '(hover: hover)',
  '(display-mode: standalone)',
] as const;

export function useDeviceRuntimeProfile(): PoietekDeviceRuntimeProfile {
  const [profile, setProfile] = useState<PoietekDeviceRuntimeProfile>(probeBrowserDeviceProfile);

  useEffect(() => {
    let animationFrame = 0;
    const update = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => setProfile(probeBrowserDeviceProfile()));
    };
    const queries = mediaQueries.map((query) => window.matchMedia(query));
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    window.visualViewport?.addEventListener('resize', update);
    queries.forEach((query) => query.addEventListener('change', update));
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      window.visualViewport?.removeEventListener('resize', update);
      queries.forEach((query) => query.removeEventListener('change', update));
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.poietekDevice = profile.deviceClass;
    document.documentElement.dataset.poietekDeviceLayout = profile.layout;
    document.documentElement.dataset.poietekInput = profile.inputMode;
    document.documentElement.dataset.poietekOrientation = profile.orientation;
    document.documentElement.style.setProperty('--poietek-touch-target', `${profile.touchTargetPx}px`);
  }, [profile]);

  return profile;
}
