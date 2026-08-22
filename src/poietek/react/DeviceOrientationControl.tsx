import {RotateCw} from 'lucide-react';
import {useCallback, useEffect, useMemo, useState} from 'react';
import type {PoietekDeviceRuntimeProfile} from '../deployment';

type OrientationControlState = 'idle' | 'requesting' | 'locked' | 'blocked' | 'unavailable';
type RequestedOrientation = 'landscape-primary' | 'portrait-primary';

type LockableScreenOrientation = {
  lock?: (orientation: RequestedOrientation) => Promise<void>;
};

function getOrientationApi(): LockableScreenOrientation | null {
  if (typeof screen === 'undefined' || !screen.orientation) return null;
  return screen.orientation as unknown as LockableScreenOrientation;
}

function statusMessage(state: OrientationControlState, targetLabel: string): string {
  if (state === 'requesting') return `Requesting ${targetLabel.toLowerCase()} orientation…`;
  if (state === 'locked') return `${targetLabel} orientation is active. Poietek is adapting to the reported viewport.`;
  if (state === 'blocked') return 'Rotation lock was blocked by this device. Turn it physically; Poietek will adapt when rotation is permitted.';
  if (state === 'unavailable') return 'Automatic layout response is active. This browser does not allow Poietek to lock orientation.';
  return '';
}

export function DeviceOrientationControl({deviceProfile}: {deviceProfile: PoietekDeviceRuntimeProfile}) {
  const [state, setState] = useState<OrientationControlState>('idle');
  const isTouchDevice = deviceProfile.deviceClass === 'mobile' || deviceProfile.deviceClass === 'tablet';
  const target: RequestedOrientation = deviceProfile.orientation === 'landscape'
    ? 'portrait-primary'
    : 'landscape-primary';
  const targetLabel = target === 'landscape-primary' ? 'Landscape' : 'Portrait';
  const message = useMemo(() => statusMessage(state, targetLabel), [state, targetLabel]);

  useEffect(() => {
    if (state !== 'locked' && state !== 'blocked' && state !== 'unavailable') return;
    const timeout = window.setTimeout(() => setState('idle'), 6000);
    return () => window.clearTimeout(timeout);
  }, [state]);

  const requestRotation = useCallback(async () => {
    const orientation = getOrientationApi();
    if (!orientation?.lock) {
      setState('unavailable');
      return;
    }

    setState('requesting');
    try {
      await orientation.lock(target);
      setState('locked');
    } catch (error) {
      const name = typeof error === 'object' && error !== null && 'name' in error
        ? String((error as {name?: unknown}).name ?? '')
        : '';
      setState(name === 'NotAllowedError' || name === 'SecurityError' ? 'blocked' : 'unavailable');
    }
  }, [target]);

  if (!isTouchDevice) return null;

  return (
    <div className="poietek-orientation-control" data-status={state}>
      <button
        type="button"
        onClick={requestRotation}
        disabled={state === 'requesting'}
        aria-label={`Rotate to ${targetLabel.toLowerCase()}`}
        title={`Request ${targetLabel.toLowerCase()} orientation. The layout also follows permitted physical rotation automatically.`}
      >
        <RotateCw aria-hidden="true" />
        <span>
          <strong>Rotate</strong>
          <small>{targetLabel}</small>
        </span>
      </button>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
