"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

interface BuildingCardProps {
  name: string;
  slug: string;
  stages?: number; // 0-3 completed stages at current difficulty
  shouldAnimate?: boolean; // Whether to trigger animation (e.g., when returning from conversation)
}

// Map stages to image level (1-3)
// stages 0 = level-1, stages 1 = level-2, stages 2+ = level-3
function getImageLevel(stages: number): number {
  return Math.min(stages + 1, 3);
}

export default function BuildingCard({
  name,
  slug,
  stages = 0,
  shouldAnimate = false,
}: BuildingCardProps) {
  const imageLevel = getImageLevel(stages);
  const imageSrc = `/buildings/${slug}-level-${imageLevel}.png`;
  const isComplete = stages >= 3;
  const [isAnimating, setIsAnimating] = useState(false);
  const prevImageLevelRef = useRef<number>(imageLevel);
  const prevShouldAnimateRef = useRef<boolean>(false);

  // Trigger squash/stretch animation only when shouldAnimate is true and level increased
  useEffect(() => {
    // Only animate if:
    // 1. shouldAnimate flag transitions from false to true
    // 2. The image level actually increased (not just changed)
    // 3. We had a previous level (not initial mount)
    if (
      shouldAnimate &&
      !prevShouldAnimateRef.current &&
      imageLevel > prevImageLevelRef.current &&
      prevImageLevelRef.current > 0
    ) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 600); // Animation duration
      return () => clearTimeout(timer);
    }
    prevImageLevelRef.current = imageLevel;
    prevShouldAnimateRef.current = shouldAnimate;
  }, [imageLevel, shouldAnimate]);

  const content = (
    <div className="relative group">
      {/* Glow effect for completed buildings */}
      {isComplete && (
        <div
          className="
            absolute inset-0 
            bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400
            blur-xl opacity-60
            animate-pulse
            rounded-full
            scale-75
          "
        />
      )}
      <Image
        src={imageSrc}
        alt={name}
        width={280}
        height={280}
        className={`
          relative
          w-[200px] h-[200px]
          sm:w-[240px] sm:h-[240px]
          md:w-[280px] md:h-[280px]
          lg:w-[320px] lg:h-[320px]
          object-contain
          transition-all duration-300
          ${isAnimating ? "animate-[squashStretch_0.6s_ease-in-out]" : ""}
          ${
            isComplete
              ? "drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]"
              : "drop-shadow-lg group-hover:drop-shadow-2xl"
          }
        `}
        priority
      />
      <span
        className={`
          absolute -bottom-1 left-1/2 -translate-x-1/2
          bg-white/90 backdrop-blur-sm
          px-4 py-1.5 rounded-full
          text-sm sm:text-base font-semibold
          whitespace-nowrap
          shadow-md
          transition-opacity duration-300
          ${
            isComplete
              ? "opacity-100 text-amber-600 bg-amber-50/90"
              : "opacity-0 group-hover:opacity-100 text-[#2d5a3d]"
          }
        `}
      >
        {isComplete ? "✓ Complete" : name}
      </span>
    </div>
  );

  // If complete, render as non-clickable div
  if (isComplete) {
    return <div className="block w-fit">{content}</div>;
  }

  // Otherwise, render as clickable link
  return (
    <Link
      href={`/${slug}`}
      className="
        block w-fit
        transition-all duration-300 ease-out
        hover:scale-105 hover:-translate-y-1
        active:scale-95
        cursor-pointer
      "
    >
      {content}
    </Link>
  );
}
