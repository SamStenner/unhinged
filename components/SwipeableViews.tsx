"use client";

import { useRef, useEffect, type ReactNode } from "react";

interface SwipeableViewsProps {
  activeIndex: number;
  onIndexChange: (index: number) => void;
  children: ReactNode[];
  scrollEnabled?: boolean;
}

export default function SwipeableViews({
  activeIndex,
  onIndexChange,
  children,
  scrollEnabled = true,
}: SwipeableViewsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  // Sync scroll position when activeIndex changes (from tab click)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isScrollingRef.current) return;

    const targetScroll = activeIndex * container.offsetWidth;
    container.scrollTo({ left: targetScroll, behavior: "smooth" });
  }, [activeIndex]);

  // Handle scroll end to update activeIndex
  const handleScroll = () => {
    if (!scrollEnabled) return;

    const container = containerRef.current;
    if (!container) return;

    isScrollingRef.current = true;

    // Debounce to detect scroll end
    clearTimeout((container as HTMLDivElement & { scrollTimeout?: number }).scrollTimeout);
    (container as HTMLDivElement & { scrollTimeout?: number }).scrollTimeout = window.setTimeout(() => {
      const newIndex = Math.round(container.scrollLeft / container.offsetWidth);
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < children.length) {
        onIndexChange(newIndex);
      }
      isScrollingRef.current = false;
    }, 100);
  };

  return (
    <div
      ref={containerRef}
      className={`w-full h-full overflow-y-hidden snap-x snap-mandatory hide-scrollbar ${scrollEnabled ? "overflow-x-auto" : "overflow-x-hidden"
        }`}
      onScroll={handleScroll}
      style={{
        scrollBehavior: "smooth",
        touchAction: scrollEnabled ? "pan-x pan-y" : "pan-y",
      }}
    >
      <div className="flex h-full" style={{ width: `${children.length * 100}%` }}>
        {children.map((child, index) => (
          <div
            key={index}
            className="h-full overflow-y-auto overflow-x-hidden snap-start snap-always"
            style={{ width: `${100 / children.length}%` }}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
