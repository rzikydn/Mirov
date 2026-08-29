import React, { useState, useEffect, useRef } from 'react';
import { StickyBanner } from '@/components/ui/sticky-banner';
import { useServerStatus } from '@/hooks/useServerStatus';

export const OfflineBanner: React.FC = () => {
  // Do not render banner inside widget iframe (/widget-only)
  if (typeof window !== 'undefined' && window.location.pathname.includes('/widget-only')) {
    return null;
  }

  const { isOffline } = useServerStatus();
  const [showRestored, setShowRestored] = useState(false);
  const [yellowDismissed, setYellowDismissed] = useState(false);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (isOffline) {
      wasOfflineRef.current = true;
      setShowRestored(false);
      setYellowDismissed(false); // Reset dismissal on new offline state
    } else {
      if (wasOfflineRef.current) {
        // Transitioned from offline -> online!
        wasOfflineRef.current = false;
        setShowRestored(true);
      }
    }
  }, [isOffline]);

  if (isOffline && !yellowDismissed) {
    return (
      <StickyBanner
        open={true}
        onClose={() => setYellowDismissed(true)}
        backgroundColor="#FDE082"
        className="border-amber-300/80"
      >
        <div className="flex items-center justify-center whitespace-nowrap overflow-hidden text-[11px] sm:text-xs font-medium tracking-tight text-amber-950 font-sans">
          <span className="truncate">
            Server connection lost. You are currently in <strong>Offline Mode</strong>. Added or modified data will be saved locally and automatically synced once the server is restored.
          </span>
        </div>
      </StickyBanner>
    );
  }

  if (!isOffline && showRestored) {
    return (
      <StickyBanner
        open={true}
        onClose={() => setShowRestored(false)}
        backgroundColor="#A7F3D0"
        className="border-emerald-300/80"
      >
        <div className="flex items-center justify-center whitespace-nowrap overflow-hidden text-[11px] sm:text-xs font-medium tracking-tight text-emerald-950 font-sans">
          <span className="truncate">
            Server connection restored. You are back online and all data has been synchronized.
          </span>
        </div>
      </StickyBanner>
    );
  }

  return null;
};
