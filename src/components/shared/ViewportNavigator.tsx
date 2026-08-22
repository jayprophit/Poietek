import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Maximize2, Minus, Plus} from 'lucide-react';
import './ViewportNavigator.css';

interface ScrollMetrics {
  left: number;
  top: number;
  maxLeft: number;
  maxTop: number;
}

export interface ViewportNavigatorProps {
  ariaLabel: string;
  children: ReactNode;
  zoom: number;
  onZoomChange(zoom: number): void;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  autoFit?: boolean;
  onAutoFitChange?(autoFit: boolean): void;
  fitContentWidth?: number;
  zoomPresets?: readonly number[];
  variant?: 'rack' | 'arranger';
  viewportClassName?: string;
  contentClassName?: string;
}

const EMPTY_METRICS: ScrollMetrics = {left: 0, top: 0, maxLeft: 0, maxTop: 0};

const percentage = (value: number, maximum: number) =>
  maximum > 0 ? Math.round((value / maximum) * 100) : 0;

export function ViewportNavigator({
  ariaLabel,
  children,
  zoom,
  onZoomChange,
  minZoom = 0.65,
  maxZoom = 2,
  zoomStep = 0.1,
  autoFit = false,
  onAutoFitChange,
  fitContentWidth,
  zoomPresets = [],
  variant = 'rack',
  viewportClassName = '',
  contentClassName = '',
}: ViewportNavigatorProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<ScrollMetrics>(EMPTY_METRICS);

  const applyAutoFit = useCallback(() => {
    const viewport = viewportRef.current;
    if (!autoFit || !viewport || !fitContentWidth || fitContentWidth <= 0) return;
    const availableWidth = Math.max(1, viewport.clientWidth - 8);
    const fitMaximum = Math.min(1, maxZoom);
    const fittedZoom = Math.round(
      Math.min(fitMaximum, Math.max(minZoom, availableWidth / fitContentWidth)) * 1000,
    ) / 1000;
    if (Math.abs(fittedZoom - zoom) >= 0.005) onZoomChange(fittedZoom);
  }, [autoFit, fitContentWidth, maxZoom, minZoom, onZoomChange, zoom]);

  const updateMetrics = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    setMetrics({
      left: viewport.scrollLeft,
      top: viewport.scrollTop,
      maxLeft: Math.max(0, viewport.scrollWidth - viewport.clientWidth),
      maxTop: Math.max(0, viewport.scrollHeight - viewport.clientHeight),
    });
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport) return;

    const handleScroll = () => updateMetrics();
    viewport.addEventListener('scroll', handleScroll, {passive: true});
    window.addEventListener('resize', updateMetrics);

    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateMetrics);
    observer?.observe(viewport);
    if (content) observer?.observe(content);

    const frame = window.requestAnimationFrame(updateMetrics);
    return () => {
      window.cancelAnimationFrame(frame);
      viewport.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateMetrics);
      observer?.disconnect();
    };
  }, [updateMetrics, zoom]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !autoFit || !fitContentWidth) return;
    const fit = () => applyAutoFit();
    window.addEventListener('resize', fit);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);
    observer?.observe(viewport);
    const frame = window.requestAnimationFrame(fit);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', fit);
      observer?.disconnect();
    };
  }, [applyAutoFit, autoFit, fitContentWidth]);

  const setScrollPercentage = (axis: 'horizontal' | 'vertical', value: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const ratio = value / 100;
    viewport.scrollTo({
      left: axis === 'horizontal' ? metrics.maxLeft * ratio : viewport.scrollLeft,
      top: axis === 'vertical' ? metrics.maxTop * ratio : viewport.scrollTop,
      behavior: 'auto',
    });
  };

  const nudge = (axis: 'horizontal' | 'vertical', direction: -1 | 1) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollBy({
      left: axis === 'horizontal' ? direction * Math.max(120, viewport.clientWidth * 0.72) : 0,
      top: axis === 'vertical' ? direction * Math.max(120, viewport.clientHeight * 0.72) : 0,
      behavior: 'smooth',
    });
  };

  const changeZoom = (next: number) => {
    const rounded = Math.round(Math.min(maxZoom, Math.max(minZoom, next)) * 100) / 100;
    if (autoFit) onAutoFitChange?.(false);
    onZoomChange(rounded);
  };

  const toggleAutoFit = () => {
    if (!onAutoFitChange || !fitContentWidth) return;
    onAutoFitChange(!autoFit);
  };

  const horizontalPercent = percentage(metrics.left, metrics.maxLeft);
  const verticalPercent = percentage(metrics.top, metrics.maxTop);
  const zoomPercent = Math.round(zoom * 100);
  const selectedZoomPreset = zoomPresets.find((preset) => Math.abs(preset - zoom) < 0.005);
  const zoomPresetValue = autoFit
    ? 'auto'
    : selectedZoomPreset === undefined
      ? 'custom'
      : String(selectedZoomPreset);
  const contentStyle = {zoom} as CSSProperties;

  return (
    <div className={`poietek-viewport-navigator poietek-viewport-navigator--${variant}`}>
      <div
        ref={viewportRef}
        className={`poietek-viewport-surface ${viewportClassName}`.trim()}
        tabIndex={0}
        aria-label={ariaLabel}
      >
        <div ref={contentRef} className={contentClassName} style={contentStyle}>
          {children}
        </div>
      </div>

      <aside className="poietek-viewport-vertical" aria-label={`${ariaLabel} vertical navigation`}>
        <button type="button" onClick={() => nudge('vertical', -1)} aria-label={`${ariaLabel}: scroll up`} disabled={metrics.maxTop === 0}>
          <ChevronUp aria-hidden="true" />
        </button>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={verticalPercent}
          onChange={(event) => setScrollPercentage('vertical', Number(event.target.value))}
          aria-label={`${ariaLabel}: vertical scrollbar`}
          disabled={metrics.maxTop === 0}
        />
        <button type="button" onClick={() => nudge('vertical', 1)} aria-label={`${ariaLabel}: scroll down`} disabled={metrics.maxTop === 0}>
          <ChevronDown aria-hidden="true" />
        </button>
      </aside>

      <footer className="poietek-viewport-footer" aria-label={`${ariaLabel} horizontal and zoom navigation`}>
        <button type="button" onClick={() => nudge('horizontal', -1)} aria-label={`${ariaLabel}: scroll left`} disabled={metrics.maxLeft === 0}>
          <ChevronLeft aria-hidden="true" />
        </button>
        <input
          className="poietek-viewport-horizontal-range"
          type="range"
          min="0"
          max="100"
          step="1"
          value={horizontalPercent}
          onChange={(event) => setScrollPercentage('horizontal', Number(event.target.value))}
          aria-label={`${ariaLabel}: horizontal scrollbar`}
          disabled={metrics.maxLeft === 0}
        />
        <button type="button" onClick={() => nudge('horizontal', 1)} aria-label={`${ariaLabel}: scroll right`} disabled={metrics.maxLeft === 0}>
          <ChevronRight aria-hidden="true" />
        </button>
        <output className="poietek-viewport-position" aria-live="off">
          X {horizontalPercent}% · Y {verticalPercent}%
        </output>
        <div className="poietek-viewport-zoom" aria-label={`${ariaLabel} zoom controls`}>
          {fitContentWidth && onAutoFitChange && (
            <button
              type="button"
              className={`poietek-viewport-auto-fit ${autoFit ? 'poietek-viewport-auto-fit--active' : ''}`}
              onClick={toggleAutoFit}
              aria-label={`${ariaLabel}: auto fit width`}
              aria-pressed={autoFit}
              title={autoFit ? 'Auto fit is following the available width' : 'Automatically fit the full rack width'}
            >
              <Maximize2 aria-hidden="true" />
              <span>AUTO</span>
            </button>
          )}
          <button type="button" onClick={() => changeZoom(zoom - zoomStep)} aria-label={`${ariaLabel}: zoom out`} disabled={zoom <= minZoom}>
            <Minus aria-hidden="true" />
          </button>
          {zoomPresets.length > 0 ? (
            <select
              className="poietek-viewport-zoom-presets"
              value={zoomPresetValue}
              onChange={(event) => {
                const value = event.target.value;
                if (value === 'auto') {
                  onAutoFitChange?.(true);
                  return;
                }
                if (value === 'custom') return;
                changeZoom(Number(value));
              }}
              aria-label={`${ariaLabel}: zoom preset`}
              title="Choose a fixed rack size"
            >
              {autoFit && <option value="auto">AUTO {zoomPercent}%</option>}
              {!autoFit && selectedZoomPreset === undefined && <option value="custom">Custom {zoomPercent}%</option>}
              {zoomPresets.map((preset) => (
                <option key={preset} value={preset}>
                  {preset === 1 ? 'Default 100%' : `${Math.round(preset * 100)}%`}
                </option>
              ))}
            </select>
          ) : (
            <button type="button" className="poietek-viewport-zoom-reset" onClick={() => changeZoom(1)} aria-label={`${ariaLabel}: reset zoom to 100%`}>
              {zoomPercent}%
            </button>
          )}
          <button type="button" onClick={() => changeZoom(zoom + zoomStep)} aria-label={`${ariaLabel}: zoom in`} disabled={zoom >= maxZoom}>
            <Plus aria-hidden="true" />
          </button>
        </div>
      </footer>
    </div>
  );
}
