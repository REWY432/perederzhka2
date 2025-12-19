
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';

interface Props {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  scrollContainerId?: string; // ID of the container that scrolls
}

const PullToRefresh: React.FC<Props> = ({ onRefresh, children, scrollContainerId }) => {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0); // 0 to 100

  // Configuration
  const THRESHOLD = 80; // px to trigger refresh
  const MAX_PULL = 140; // max px visual pull

  const contentRef = useRef<HTMLDivElement>(null);

  const getScrollTop = () => {
    if (scrollContainerId) {
      const el = document.getElementById(scrollContainerId);
      return el ? el.scrollTop : 0;
    }
    return window.scrollY;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (getScrollTop() <= 0 && !isRefreshing) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const scrollTop = getScrollTop();
    const touchY = e.touches[0].clientY;
    const diff = touchY - startY;

    // Only activate if we are at the top and pulling down
    if (scrollTop <= 0 && diff > 0 && !isRefreshing) {
      // Prevent default to stop browser native refresh behavior if possible
      // Note: passive listeners might prevent e.preventDefault(), handled via CSS overscroll-behavior usually
      
      // Calculate resistance (logarithmic-ish)
      const damped = Math.min(diff * 0.45, MAX_PULL); 
      setCurrentY(damped);
      setPullProgress(Math.min((damped / THRESHOLD) * 100, 100));
    }
  };

  const handleTouchEnd = async () => {
    if (!isRefreshing && currentY > THRESHOLD) {
      setIsRefreshing(true);
      setCurrentY(THRESHOLD); // Snap to threshold
      
      try {
        // Haptic feedback if available
        if (navigator.vibrate) navigator.vibrate(50);
        await onRefresh();
      } finally {
        setTimeout(() => {
            setIsRefreshing(false);
            setCurrentY(0);
            setPullProgress(0);
        }, 500);
      }
    } else {
      // Cancel pull
      setIsRefreshing(false);
      setCurrentY(0);
      setPullProgress(0);
    }
    setStartY(0);
  };

  return (
    <div 
      ref={contentRef}
      className="relative min-h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Loading Indicator Container */}
      <div 
        className="absolute top-0 left-0 w-full flex justify-center pointer-events-none z-10"
        style={{ 
            height: `${currentY}px`,
            opacity: currentY > 0 ? 1 : 0,
            transition: isRefreshing ? 'height 0.2s ease-out' : 'height 0s'
        }}
      >
        <div className="flex flex-col items-center justify-end pb-4 overflow-hidden">
            {isRefreshing ? (
                <div className="flex items-center gap-2 bg-white/90 dark:bg-black/80 px-4 py-2 rounded-full shadow-lg border border-teal-500/30 backdrop-blur-md">
                    <Loader2 className="animate-spin text-teal-600 dark:text-teal-400" size={20} />
                    <span className="text-xs font-bold text-teal-800 dark:text-teal-200">Обновление...</span>
                </div>
            ) : (
                <div 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                        pullProgress >= 100 
                            ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 scale-110' 
                            : 'bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                    }`}
                >
                    <ArrowDown 
                        size={18} 
                        style={{ transform: `rotate(${pullProgress * 1.8}deg)` }} // Rotate arrow as you pull
                        className="transition-transform duration-75"
                    />
                    <span className="text-[10px] font-bold">
                        {pullProgress >= 100 ? 'Отпустите' : 'Тяните'}
                    </span>
                </div>
            )}
        </div>
      </div>

      {/* Main Content with Transform */}
      <div 
        style={{ 
            transform: `translateY(${currentY}px)`,
            transition: isRefreshing || currentY === 0 ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
            touchAction: 'pan-y' // Important for browser handling
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
