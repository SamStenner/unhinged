"use client";

import { useRef, useEffect, type ReactNode } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";

interface SwipeableViewsProps {
  activeIndex: number;
  onIndexChange: (index: number) => void;
  children: ReactNode[];
  allowSwipe?: boolean;
}

export default function SwipeableViews({
  activeIndex,
  onIndexChange,
  children,
  allowSwipe = true,
}: SwipeableViewsProps) {
  const swiperRef = useRef<SwiperType | null>(null);

  // Sync swiper when activeIndex changes externally (e.g., tab click)
  useEffect(() => {
    if (swiperRef.current && swiperRef.current.activeIndex !== activeIndex) {
      swiperRef.current.slideTo(activeIndex);
    }
  }, [activeIndex]);

  // Enable/disable swiping when allowSwipe changes
  useEffect(() => {
    if (swiperRef.current) {
      swiperRef.current.allowTouchMove = allowSwipe;
    }
  }, [allowSwipe]);

  return (
    <Swiper
      onSwiper={(swiper) => {
        swiperRef.current = swiper;
      }}
      onSlideChange={(swiper) => {
        onIndexChange(swiper.activeIndex);
      }}
      initialSlide={activeIndex}
      spaceBetween={0}
      slidesPerView={1}
      autoHeight={true}
      simulateTouch={true}
      touchStartPreventDefault={false}
      allowTouchMove={allowSwipe}
    >
      {children.map((child, index) => (
        <SwiperSlide key={index}>
          {child}
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
