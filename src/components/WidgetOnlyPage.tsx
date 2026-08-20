import { useEffect } from 'react';
import BsmrChatWidget from './widget/BsmrChatWidget';

export default function WidgetOnlyPage() {
  useEffect(() => {
    // Set transparent background for iframe embedding
    document.body.style.backgroundColor = 'transparent';
    document.body.style.overflow = 'hidden';
  }, []);

  return (
    <div className="w-full h-screen bg-transparent overflow-hidden">
      <BsmrChatWidget />
    </div>
  );
}
