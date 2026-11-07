import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type FormFactor = 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'ultrawide';
export type PerformanceTier = 'low' | 'medium' | 'high' | 'ultra';
export type PerfModePreference = 'auto' | 'performance' | 'quality';

export interface DeviceContextValue {
  // Screen & Viewport
  width: number;
  height: number;
  dpr: number;
  aspectRatio: number;
  orientation: 'portrait' | 'landscape';
  deviceType: DeviceType;
  formFactor: FormFactor;
  isTouch: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;

  // Hardware Specs & Resources
  cpuCores: number;
  deviceMemoryGB: number | null;
  gpuVendor: string;
  gpuRenderer: string;
  isWeakGpu: boolean;
  isStrongGpu: boolean;

  // Network & Battery
  networkType: string;
  saveData: boolean;
  isLowBattery: boolean;
  batteryLevel: number | null;
  isCharging: boolean | null;
  prefersReducedMotion: boolean;

  // Performance Rating & Tuning
  tier: PerformanceTier;
  perfMode: PerfModePreference;
  setPerfMode: (mode: PerfModePreference) => void;
  reducedGraphics: boolean;
  recommendedParticleCount: number;
}

const DeviceContext = createContext<DeviceContextValue | null>(null);

function getGpuInfo() {
  if (typeof window === 'undefined') {
    return { vendor: 'Server', renderer: 'Server', isWeak: false, isStrong: false };
  }
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return { vendor: 'Generic', renderer: 'Generic', isWeak: false, isStrong: false };

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown' : 'Unknown';
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown' : 'Unknown';

    const lower = `${renderer} ${vendor}`.toLowerCase();

    const isWeak =
      lower.includes('swiftshader') ||
      lower.includes('llvmpipe') ||
      lower.includes('software') ||
      lower.includes('mali-400') ||
      lower.includes('mali-t') ||
      lower.includes('adreno (tm) 3') ||
      lower.includes('adreno (tm) 505') ||
      lower.includes('adreno (tm) 506') ||
      lower.includes('powervr') ||
      lower.includes('intel hd graphics 3000') ||
      lower.includes('intel hd graphics 4000') ||
      lower.includes('intel hd graphics 2000') ||
      lower.includes('basic render');

    const isStrong =
      lower.includes('apple m') ||
      lower.includes('rtx') ||
      lower.includes('radeon rx') ||
      lower.includes('geforce gtx 1080') ||
      lower.includes('geforce gtx 1070') ||
      lower.includes('adreno (tm) 7') ||
      lower.includes('apple a1') ||
      lower.includes('mali-g7');

    return { vendor, renderer, isWeak, isStrong };
  } catch {
    return { vendor: 'Unknown', renderer: 'Unknown', isWeak: false, isStrong: false };
  }
}

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  // Initial dimensions
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
    dpr: typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1,
  }));

  // User preference override stored in localStorage
  const [perfMode, setPerfModeState] = useState<PerfModePreference>(() => {
    if (typeof window === 'undefined') return 'auto';
    try {
      const saved = localStorage.getItem('msk_perf_mode') as PerfModePreference;
      if (saved === 'performance' || saved === 'quality' || saved === 'auto') return saved;
    } catch {
      // fallback
    }
    return 'auto';
  });

  const setPerfMode = useCallback((mode: PerfModePreference) => {
    setPerfModeState(mode);
    try {
      localStorage.setItem('msk_perf_mode', mode);
    } catch {
      // ignore
    }
  }, []);

  // Screen resize listener with debounce / RAF
  useEffect(() => {
    let timeoutId: number;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setViewport({
          width: window.innerWidth,
          height: window.innerHeight,
          dpr: window.devicePixelRatio || 1,
        });
      }, 100);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Hardware Specs
  const gpuInfo = useMemo(() => getGpuInfo(), []);
  const cpuCores = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 4) : 4;
  const deviceMemoryGB = typeof navigator !== 'undefined' && 'deviceMemory' in navigator
    ? ((navigator as unknown as { deviceMemory?: number }).deviceMemory ?? null)
    : null;

  // Touch & Pointer
  const isTouch = typeof window !== 'undefined' && (
    'ontouchstart' in window ||
    (navigator.maxTouchPoints > 0)
  );

  // Form factor & device classification
  const { deviceType, formFactor } = useMemo(() => {
    const w = viewport.width;
    if (w < 640) {
      return { deviceType: 'mobile' as DeviceType, formFactor: 'mobile' as FormFactor };
    }
    if (w < 1024) {
      return {
        deviceType: (isTouch ? 'tablet' : 'desktop') as DeviceType,
        formFactor: 'tablet' as FormFactor,
      };
    }
    if (w < 1440) {
      return { deviceType: 'desktop' as DeviceType, formFactor: 'laptop' as FormFactor };
    }
    if (w < 1920) {
      return { deviceType: 'desktop' as DeviceType, formFactor: 'desktop' as FormFactor };
    }
    return { deviceType: 'desktop' as DeviceType, formFactor: 'ultrawide' as FormFactor };
  }, [viewport.width, isTouch]);

  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  const isDesktop = deviceType === 'desktop';
  const orientation = viewport.width >= viewport.height ? 'landscape' : 'portrait';
  const aspectRatio = viewport.width / (viewport.height || 1);

  // Network & Battery state
  const [networkType, setNetworkType] = useState('4g');
  const [saveData, setSaveData] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const nav = navigator as unknown as {
      connection?: {
        effectiveType?: string;
        saveData?: boolean;
        addEventListener?: (type: string, listener: () => void) => void;
        removeEventListener?: (type: string, listener: () => void) => void;
      };
      getBattery?: () => Promise<{
        level: number;
        charging: boolean;
        addEventListener: (type: string, listener: () => void) => void;
        removeEventListener: (type: string, listener: () => void) => void;
      }>;
    };

    if (nav.connection) {
      setNetworkType(nav.connection.effectiveType || '4g');
      setSaveData(Boolean(nav.connection.saveData));
      const connChange = () => {
        setNetworkType(nav.connection?.effectiveType || '4g');
        setSaveData(Boolean(nav.connection?.saveData));
      };
      nav.connection.addEventListener?.('change', connChange);
    }

    if (typeof nav.getBattery === 'function') {
      nav.getBattery().then((battery) => {
        setBatteryLevel(battery.level);
        setIsCharging(battery.charging);
        const updateBattery = () => {
          setBatteryLevel(battery.level);
          setIsCharging(battery.charging);
        };
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch(() => {
        // Battery API blocked or unsupported
      });
    }
  }, []);

  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const isLowBattery = batteryLevel !== null && batteryLevel <= 0.20 && isCharging === false;

  // Compute adaptive tier
  const tier: PerformanceTier = useMemo(() => {
    if (perfMode === 'performance') return 'low';
    if (perfMode === 'quality') return isMobile ? 'high' : 'ultra';

    // Auto smart rating
    if (saveData || prefersReducedMotion || gpuInfo.isWeak || isLowBattery) {
      return 'low';
    }
    if (networkType === '2g' || networkType === 'slow-2g') {
      return 'low';
    }

    // Mobile classification
    if (isMobile) {
      if (cpuCores <= 4 || (deviceMemoryGB && deviceMemoryGB <= 3)) {
        return 'low';
      }
      if (cpuCores <= 6 || (deviceMemoryGB && deviceMemoryGB <= 6)) {
        return 'medium';
      }
      return 'high';
    }

    // Desktop/Laptop classification
    if (cpuCores <= 4 || (deviceMemoryGB && deviceMemoryGB <= 4)) {
      return 'medium';
    }
    if (gpuInfo.isStrong && cpuCores >= 8 && (!deviceMemoryGB || deviceMemoryGB >= 8)) {
      return 'ultra';
    }
    return 'high';
  }, [
    perfMode,
    saveData,
    prefersReducedMotion,
    gpuInfo.isWeak,
    gpuInfo.isStrong,
    isLowBattery,
    networkType,
    isMobile,
    cpuCores,
    deviceMemoryGB,
  ]);

  const reducedGraphics = tier === 'low';

  const recommendedParticleCount = useMemo(() => {
    switch (tier) {
      case 'low': return 0;
      case 'medium': return 10;
      case 'high': return 25;
      case 'ultra': return 40;
    }
  }, [tier]);

  // Apply root HTML classes and attributes for instant CSS styling
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-device', deviceType);
    root.setAttribute('data-form-factor', formFactor);
    root.setAttribute('data-perf-tier', tier);
    root.setAttribute('data-touch', isTouch ? 'true' : 'false');
    root.setAttribute('data-reduced-graphics', reducedGraphics ? 'true' : 'false');

    if (reducedGraphics) {
      root.classList.add('perf-mode-low');
    } else {
      root.classList.remove('perf-mode-low');
    }
  }, [deviceType, formFactor, tier, isTouch, reducedGraphics]);

  const value = useMemo<DeviceContextValue>(() => ({
    width: viewport.width,
    height: viewport.height,
    dpr: viewport.dpr,
    aspectRatio,
    orientation,
    deviceType,
    formFactor,
    isTouch,
    isMobile,
    isTablet,
    isDesktop,
    cpuCores,
    deviceMemoryGB,
    gpuVendor: gpuInfo.vendor,
    gpuRenderer: gpuInfo.renderer,
    isWeakGpu: gpuInfo.isWeak,
    isStrongGpu: gpuInfo.isStrong,
    networkType,
    saveData,
    isLowBattery,
    batteryLevel,
    isCharging,
    prefersReducedMotion,
    tier,
    perfMode,
    setPerfMode,
    reducedGraphics,
    recommendedParticleCount,
  }), [
    viewport,
    aspectRatio,
    orientation,
    deviceType,
    formFactor,
    isTouch,
    isMobile,
    isTablet,
    isDesktop,
    cpuCores,
    deviceMemoryGB,
    gpuInfo,
    networkType,
    saveData,
    isLowBattery,
    batteryLevel,
    isCharging,
    prefersReducedMotion,
    tier,
    perfMode,
    setPerfMode,
    reducedGraphics,
    recommendedParticleCount,
  ]);

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
}

const defaultDeviceValue: DeviceContextValue = {
  width: typeof window !== 'undefined' ? window.innerWidth : 1200,
  height: typeof window !== 'undefined' ? window.innerHeight : 800,
  dpr: typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1,
  aspectRatio: 16 / 9,
  orientation: 'landscape',
  deviceType: 'desktop',
  formFactor: 'desktop',
  isTouch: false,
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  cpuCores: 4,
  deviceMemoryGB: null,
  gpuVendor: 'Generic',
  gpuRenderer: 'Generic',
  isWeakGpu: false,
  isStrongGpu: false,
  networkType: '4g',
  saveData: false,
  isLowBattery: false,
  batteryLevel: null,
  isCharging: null,
  prefersReducedMotion: false,
  tier: 'high',
  perfMode: 'auto',
  setPerfMode: () => {},
  reducedGraphics: false,
  recommendedParticleCount: 18,
};

export function useDevice(): DeviceContextValue {
  const context = useContext(DeviceContext);
  if (!context) {
    return defaultDeviceValue;
  }
  return context;
}
