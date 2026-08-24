import type {
  DeviceRuntimeProbeInput,
  PoietekDeviceClass,
  PoietekDeviceLayout,
  PoietekDeviceOrientation,
  PoietekDeviceRuntimeProfile,
  PoietekInputMode,
} from './contracts';

function finiteDimension(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
}

function deriveOrientation(width: number, height: number): PoietekDeviceOrientation {
  if (!width || !height) return 'unknown';
  if (Math.abs(width - height) <= 1) return 'square';
  return width > height ? 'landscape' : 'portrait';
}

function deriveInputMode(input: DeviceRuntimeProbeInput): PoietekInputMode {
  const touch = input.coarsePointer || input.maxTouchPoints > 0;
  if (touch && input.finePointer) return 'hybrid';
  if (touch) return 'touch';
  if (input.finePointer || input.hover) return 'mouse-keyboard';
  return 'unknown';
}

function deriveDeviceClass(input: DeviceRuntimeProbeInput, width: number, height: number): PoietekDeviceClass {
  if (!width) return 'other';
  const touchDevice = input.coarsePointer || input.maxTouchPoints > 0 || input.mobileHint;
  const shortestSide = height ? Math.min(width, height) : width;
  if (touchDevice && (width < 680 || shortestSide < 600)) return 'mobile';
  if (width < 1180 && touchDevice) return 'tablet';
  if (input.finePointer || width >= 1180) return 'desktop';
  return 'other';
}

function deriveLayout(deviceClass: PoietekDeviceClass, width: number): PoietekDeviceLayout {
  if (deviceClass === 'mobile' || (width > 0 && width < 680)) return 'handheld';
  if (deviceClass === 'desktop' && width >= 1180) return 'expanded';
  return 'compact';
}

export function deriveDeviceRuntimeProfile(input: DeviceRuntimeProbeInput): PoietekDeviceRuntimeProfile {
  const width = finiteDimension(input.viewportWidth);
  const height = finiteDimension(input.viewportHeight);
  const pixelRatio = Number.isFinite(input.pixelRatio) && input.pixelRatio > 0
    ? Number(input.pixelRatio.toFixed(2))
    : 1;
  const inputMode = deriveInputMode(input);
  const deviceClass = deriveDeviceClass(input, width, height);
  const layout = deriveLayout(deviceClass, width);
  const touchOptimized = inputMode === 'touch' || inputMode === 'hybrid';
  const executionSurface = input.nativeBridge ? 'native' : input.standalone ? 'installed' : 'browser';

  return {
    schemaVersion: 1,
    deviceClass,
    orientation: deriveOrientation(width, height),
    inputMode,
    layout,
    primaryNavigation: layout === 'handheld' ? 'bottom' : layout === 'compact' ? 'compact' : 'top',
    rackPresentation: layout === 'handheld' ? 'horizontal-scroll' : 'full-width',
    executionSurface,
    viewport: {width, height, pixelRatio},
    touchTargetPx: touchOptimized ? 44 : 32,
    showKeyboardShortcuts: inputMode === 'mouse-keyboard' || inputMode === 'hybrid',
    reasons: [
      `Viewport ${width || 'unknown'} × ${height || 'unknown'}`,
      `Input ${inputMode}`,
      `Surface ${executionSurface}`,
      `Layout ${layout}`,
    ],
  };
}
