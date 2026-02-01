"use client";

import Image from "next/image";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useEffect, useRef } from "react";
import { Lock } from "lucide-react";
import type { Photo } from "@/lib/types";

interface PhotoGridProps {
  photos: Photo[];
  onSwapSlots: (slotA: number, slotB: number) => void;
  onRemovePhoto: (id: string) => void;
  onAddPhoto: (slot: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  isGenerating?: boolean;
  isBlurred?: boolean;
}

// Each grid item has an ID and knows its slot
interface GridItem {
  id: string;
  slot: number;
  photo: Photo | null;
}

function SortablePhotoTile({
  item,
  onRemove,
  isBlurred = false,
}: {
  item: GridItem;
  onRemove: () => void;
  isBlurred?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: isBlurred });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.9 : 1,
  };

  if (!item.photo) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative aspect-square rounded-xl overflow-hidden bg-gray-100 ${isBlurred ? "cursor-default" : "cursor-grab active:cursor-grabbing"} ${isDragging ? "shadow-xl" : ""
        }`}
      {...(isBlurred ? {} : { ...attributes, ...listeners })}
    >
      <Image
        src={item.photo.src}
        alt={item.photo.alt}
        fill
        className="object-cover pointer-events-none"
        sizes="(max-width: 430px) 33vw, 140px"
        draggable={false}
        unoptimized={item.photo.src.startsWith("data:")}
      />
      {!isBlurred && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRemove();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute top-1.5 right-1.5 w-6 h-6 bg-white rounded-full flex items-center justify-center z-20"
          aria-label="Remove photo"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#666"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
      {isBlurred && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
            <Lock className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonLoadingTile({ item }: { item: GridItem }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id, disabled: true });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="aspect-square rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden relative"
      {...attributes}
      {...listeners}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
      {/* Loading icon */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[#67295F]/20 flex items-center justify-center">
          <svg
            className="animate-spin h-4 w-4 text-[#67295F]"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function SortableEmptyTile({
  item,
  onClick,
  isGenerating = false,
}: {
  item: GridItem;
  onClick: () => void;
  isGenerating?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id, disabled: isGenerating });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isGenerating) {
    return <SkeletonLoadingTile item={item} />;
  }

  return (
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      onClick={onClick}
      className="aspect-square rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center hover:border-gray-400 hover:bg-gray-100 transition-colors"
      {...attributes}
      {...listeners}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#9ca3af"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  );
}

export default function PhotoGrid({
  photos,
  onSwapSlots,
  onRemovePhoto,
  onAddPhoto,
  onDragStart,
  onDragEnd: onDragEndCallback,
  isGenerating = false,
  isBlurred = false,
}: PhotoGridProps) {
  // Build grid items from photos, maintaining slot order
  const buildGridItems = (currentPhotos: Photo[]): GridItem[] => {
    return [0, 1, 2, 3, 4, 5].map((slot) => {
      const photo = currentPhotos.find((p) => p.slot === slot);
      return {
        id: photo ? photo.id : `empty-${slot}`,
        slot,
        photo: photo || null,
      };
    });
  };

  const [items, setItems] = useState<GridItem[]>(() => buildGridItems(photos));
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync items when photos change (from external updates like remove)
  useEffect(() => {
    setItems(buildGridItems(photos));
  }, [photos]);

  // Prevent touch scroll on the container using native event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
    };

    container.addEventListener("touchmove", preventScroll, { passive: false });

    return () => {
      container.removeEventListener("touchmove", preventScroll);
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = () => {
    onDragStart?.();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    onDragEndCallback?.();

    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const oldSlot = items[oldIndex].slot;
    const newSlot = items[newIndex].slot;

    // Update local state immediately for smooth visual
    setItems((prev) => arrayMove(prev, oldIndex, newIndex).map((item, i) => ({
      ...item,
      slot: i,
    })));

    // Update the actual data
    onSwapSlots(oldSlot, newSlot);
  };

  const itemIds = items.map((item) => item.id);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden"
      style={{ touchAction: "none" }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={itemIds} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 gap-2">
            {items.map((item) => {
              if (item.photo) {
                return (
                  <SortablePhotoTile
                    key={item.id}
                    item={item}
                    onRemove={() => onRemovePhoto(item.photo!.id)}
                    isBlurred={isBlurred}
                  />
                );
              }
              // Don't show empty slots when showing blurred previews
              if (isBlurred) {
                return null;
              }
              return (
                <SortableEmptyTile
                  key={item.id}
                  item={item}
                  onClick={() => onAddPhoto(item.slot)}
                  isGenerating={isGenerating}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
