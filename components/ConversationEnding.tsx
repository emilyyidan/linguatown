"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ConversationEndingProps {
  onComplete?: () => void;
}

export default function ConversationEnding({ onComplete }: ConversationEndingProps) {
  const [countdown, setCountdown] = useState(3);
  const router = useRouter();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown finished
      onComplete?.();
      router.push("/");
    }
  }, [countdown, router, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl px-12 py-10 shadow-lg">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2d5a3d] mb-6">
          Conversation Complete!
        </h2>
        
        <p className="text-[#4a7c59] mb-8">
          Great job! Returning to town...
        </p>

        <div className="relative w-24 h-24 mx-auto">
          {/* Circular progress indicator */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="44"
              fill="none"
              stroke="#e8f5e9"
              strokeWidth="8"
            />
            <circle
              cx="48"
              cy="48"
              r="44"
              fill="none"
              stroke="#4a7c59"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${((3 - countdown) / 3) * 276.46} 276.46`}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          
          {/* Countdown number */}
          <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-[#2d5a3d]">
            {countdown}
          </span>
        </div>
      </div>
    </div>
  );
}

