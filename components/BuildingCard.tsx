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

// Size configuration - adjust these values to resize buildings and decorations
const SIZE_CONFIG = {
  // Building sizes in pixels (responsive breakpoints)
  building: {
    base: 170, // Mobile (default) - reduced by 15% from 200px for iPhone 17
    sm: 240, // Small screens
    md: 280, // Medium screens
    lg: 320, // Large screens
  },
  // Decoration sizes in pixels (responsive breakpoints)
  decorations: {
    bakery: {
      croissant: {
        base: 70, // Mobile (default)
        sm: 90, // Small screens
        md: 120, // Medium screens
      },
      cart: {
        base: 90, // Mobile (default)
        sm: 100, // Small screens
        md: 150, // Medium screens
      },
    },
  },
} as const;

// Decoration positioning config - flexible positioning system
// You can use percentages, ratios, pixels, or combinations for precise control
const DECORATION_POSITIONS = {
  bakery: {
    croissant: {
      // Vertical positioning options (use one or combine):
      // - top: percentage from top of building (0 = top, 0.5 = middle, 1 = bottom)
      // - topOffset: ratio of building size (0.22 = 22% of building height from top)
      // - topPx: fixed pixel offset (for fine-tuning, doesn't scale)
      // top: "22%", // Percentage from top of building container
      topOffset: 0.16, // Alternative: ratio of building size
      // topPx: 0, // Fine-tuning pixel offset

      // Horizontal positioning options:
      // - left: percentage from left (0 = left, 0.5 = center, 1 = right)
      // - center: true/false to center horizontally
      // - leftOffset: ratio of building size
      // - leftPx: fixed pixel offset
      center: true, // Center horizontally
      // left: "50%", // Alternative: specific percentage
      // leftOffset: 0, // Alternative: ratio of building size
      // leftPx: 0, // Fine-tuning pixel offset
    },
    cart: {
      // Right positioning (distance from right edge)
      // - right: percentage from right (0 = right edge, 0.1 = 10% from right)
      // - rightOffset: ratio of building size
      // - rightPx: fixed pixel offset
      right: "10%", // Percentage from right edge of building
      // rightOffset: 0.10, // Alternative: ratio of building size
      // rightPx: 0, // Fine-tuning pixel offset

      // Bottom positioning (distance from bottom edge)
      // - bottom: percentage from bottom (0 = bottom, 0.15 = 15% from bottom)
      // - bottomOffset: ratio of building size
      // - bottomPx: fixed pixel offset
      bottom: "15%", // Percentage from bottom edge of building
      // bottomOffset: 0.15, // Alternative: ratio of building size
      // bottomPx: 0, // Fine-tuning pixel offset
    },
  },
} as const;

// Map stages to image level (1-3)
// stages 0 = level-1, stages 1 = level-2, stages 2+ = level-3
function getImageLevel(stages: number): number {
  return Math.min(stages + 1, 3);
}

// Helper function to calculate decoration position from flexible config
function calculateDecorationPosition(
  config:
    | typeof DECORATION_POSITIONS.bakery.croissant
    | typeof DECORATION_POSITIONS.bakery.cart
): React.CSSProperties {
  const style: Record<string, string> = {};

  // Vertical positioning
  if ("top" in config && config.top && typeof config.top === "string") {
    style.top = config.top;
  } else if ("topOffset" in config && config.topOffset !== undefined) {
    style.top = `calc(var(--current-building-size) * ${config.topOffset})`;
  }
  if ("topPx" in config && config.topPx) {
    style.top = style.top
      ? `calc(${style.top} + ${config.topPx}px)`
      : `${config.topPx}px`;
  }

  if ("bottom" in config && config.bottom && typeof config.bottom === "string") {
    style.bottom = config.bottom;
  } else if ("bottomOffset" in config && config.bottomOffset !== undefined) {
    style.bottom = `calc(var(--current-building-size) * ${config.bottomOffset})`;
  }
  if ("bottomPx" in config && config.bottomPx) {
    style.bottom = style.bottom
      ? `calc(${style.bottom} + ${config.bottomPx}px)`
      : `${config.bottomPx}px`;
  }

  // Horizontal positioning
  if ("center" in config && config.center) {
    style.left = "50%";
    style.transform = "translateX(-50%)";
  } else if ("left" in config && config.left && typeof config.left === "string") {
    style.left = config.left;
  } else if ("leftOffset" in config && config.leftOffset !== undefined) {
    style.left = `calc(var(--current-building-size) * ${config.leftOffset})`;
  }
  if ("leftPx" in config && config.leftPx) {
    style.left = style.left
      ? `calc(${style.left} + ${config.leftPx}px)`
      : `${config.leftPx}px`;
    // If we have a transform, combine it
    if (style.transform) {
      style.transform = `${style.transform} translateX(${config.leftPx}px)`;
    }
  }

  if ("right" in config && config.right && typeof config.right === "string") {
    style.right = config.right;
  } else if ("rightOffset" in config && config.rightOffset !== undefined) {
    style.right = `calc(var(--current-building-size) * ${config.rightOffset})`;
  }
  if ("rightPx" in config && config.rightPx) {
    style.right = style.right
      ? `calc(${style.right} + ${config.rightPx}px)`
      : `${config.rightPx}px`;
  }

  return style as React.CSSProperties;
}

export default function BuildingCard({
  name,
  slug,
  stages = 0,
  shouldAnimate = false,
}: BuildingCardProps) {
  const imageLevel = getImageLevel(stages);
  // For bakery, always use base image and add decorations as layers
  const isBakery = slug === "bakery";
  const imageSrc = isBakery
    ? `/buildings/${slug}.png`
    : `/buildings/${slug}-level-${imageLevel}.png`;
  const isComplete = stages >= 3;
  const [isAnimating, setIsAnimating] = useState(false);
  const [showLevelUpAnimation, setShowLevelUpAnimation] = useState(false);
  const prevImageLevelRef = useRef<number>(imageLevel);
  const prevShouldAnimateRef = useRef<boolean>(false);
  const prevStagesRef = useRef<number>(stages);

  // Track which decorations should be visible
  const showCroissant = isBakery && stages >= 1;
  const showCart = isBakery && stages >= 2;
  const [croissantJustAdded, setCroissantJustAdded] = useState(false);
  const [cartJustAdded, setCartJustAdded] = useState(false);

  // Track when decorations are newly added
  useEffect(() => {
    if (isBakery) {
      const prevStages = prevStagesRef.current;
      if (stages === 1 && prevStages === 0) {
        setCroissantJustAdded(true);
        setTimeout(() => setCroissantJustAdded(false), 800);
      }
      if (stages === 2 && prevStages === 1) {
        setCartJustAdded(true);
        setTimeout(() => setCartJustAdded(false), 800);
      }
      prevStagesRef.current = stages;
    }
  }, [stages, isBakery]);

  // Trigger level up animation sequence when shouldAnimate is true and level increased
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
      setShowLevelUpAnimation(true);

      // Clear animation flags after sequence completes
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setShowLevelUpAnimation(false);
      }, 2500); // Total animation duration
      return () => clearTimeout(timer);
    }
    prevImageLevelRef.current = imageLevel;
    prevShouldAnimateRef.current = shouldAnimate;
  }, [imageLevel, shouldAnimate]);

  const content = (
    <div className="relative group">
      {/* Level up animation effects */}
      {showLevelUpAnimation && (
        <>
          {/* Outer glow effect */}
          <div
            className="
              absolute inset-0
              rounded-full
              animate-[outerGlow_1.5s_ease-in-out_infinite]
              pointer-events-none
              z-10
            "
          />

          {/* Sparkles */}
          {[...Array(6)].map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="
                absolute
                w-2 h-2
                bg-yellow-400
                rounded-full
                pointer-events-none
                z-20
                animate-[sparkleRise_2s_ease-out_forwards]
              "
              style={{
                left: `${20 + (i % 3) * 30}%`,
                top: `${30 + Math.floor(i / 3) * 40}%`,
                animationDelay: `${i * 0.1}s`,
                boxShadow: "0 0 6px rgba(251, 191, 36, 0.8)",
              }}
            />
          ))}
          {[...Array(4)].map((_, i) => (
            <div
              key={`sparkle-fall-${i}`}
              className="
                absolute
                w-2 h-2
                bg-amber-300
                rounded-full
                pointer-events-none
                z-20
                animate-[sparkleFall_2s_ease-out_forwards]
              "
              style={{
                left: `${40 + (i % 2) * 20}%`,
                top: `${20 + Math.floor(i / 2) * 30}%`,
                animationDelay: `${i * 0.15}s`,
                boxShadow: "0 0 6px rgba(251, 191, 36, 0.8)",
              }}
            />
          ))}
        </>
      )}

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

      {/* Building image container */}
      <div
        className={`
          relative
          building-container
          ${
            showLevelUpAnimation
              ? "animate-[buildingScaleUp_0.6s_ease-in-out]"
              : ""
          }
        `}
        style={
          {
            "--building-size-base": `${SIZE_CONFIG.building.base}px`,
            "--building-size-sm": `${SIZE_CONFIG.building.sm}px`,
            "--building-size-md": `${SIZE_CONFIG.building.md}px`,
            "--building-size-lg": `${SIZE_CONFIG.building.lg}px`,
            // Pass building size to children for proportional positioning
            "--current-building-size": "var(--building-size-base)",
          } as React.CSSProperties & Record<string, string>
        }
      >
        <Image
          src={imageSrc}
          alt={name}
          width={280}
          height={280}
          className={`
            building-size-responsive
            relative
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

        {/* Bakery decorative elements */}
        {isBakery && (
          <>
            {/* Croissant on roof */}
            {showCroissant && (
              <div
                className="absolute z-30 pointer-events-none decoration-position-croissant"
                style={calculateDecorationPosition(
                  DECORATION_POSITIONS.bakery.croissant
                )}
              >
                <Image
                  src="/buildings/bakery-croissant.png"
                  alt="Croissant"
                  width={80}
                  height={80}
                  className={`
                    decoration-size-responsive decoration-croissant
                    object-contain
                    ${
                      croissantJustAdded
                        ? "animate-[decorationReveal_0.8s_ease-out]"
                        : ""
                    }
                  `}
                  style={
                    {
                      "--decoration-size-base": `${SIZE_CONFIG.decorations.bakery.croissant.base}px`,
                      "--decoration-size-sm": `${SIZE_CONFIG.decorations.bakery.croissant.sm}px`,
                      "--decoration-size-md": `${SIZE_CONFIG.decorations.bakery.croissant.md}px`,
                    } as React.CSSProperties & Record<string, string>
                  }
                />
              </div>
            )}

            {/* Cart on side */}
            {showCart && (
              <div
                className="absolute z-30 pointer-events-none decoration-position-cart"
                style={calculateDecorationPosition(
                  DECORATION_POSITIONS.bakery.cart
                )}
              >
                <Image
                  src="/buildings/bakery-cart.png"
                  alt="Cart"
                  width={100}
                  height={100}
                  className={`
                    decoration-size-responsive decoration-cart
                    object-contain
                    ${
                      cartJustAdded
                        ? "animate-[decorationReveal_0.8s_ease-out]"
                        : ""
                    }
                  `}
                  style={
                    {
                      "--decoration-size-base": `${SIZE_CONFIG.decorations.bakery.cart.base}px`,
                      "--decoration-size-sm": `${SIZE_CONFIG.decorations.bakery.cart.sm}px`,
                      "--decoration-size-md": `${SIZE_CONFIG.decorations.bakery.cart.md}px`,
                    } as React.CSSProperties & Record<string, string>
                  }
                />
              </div>
            )}
          </>
        )}
      </div>

      <span
        className={`
          absolute -bottom-1 left-1/2 -translate-x-1/2
          bg-white/90 backdrop-blur-sm
          px-4 py-1.5 rounded-full
          text-sm sm:text-base font-semibold
          whitespace-nowrap
          shadow-md
          transition-opacity duration-300
          z-40
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
