"use client";

import { useState, useEffect } from "react";
import { Zap } from "lucide-react";

export default function FlashSaleTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetTime = new Date(endDate).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference > 0) {
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  return (
    <div className="bg-[#8C5E73] text-white px-4 py-2 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-sm">
      <div className="flex items-center space-x-1.5">
        <Zap size={14} className="text-amber-300 animate-pulse" />
        <span>Flash Sale Ends In:</span>
      </div>
      <div className="flex space-x-1 font-mono font-bold">
        <span className="bg-black/20 px-2 py-0.5 rounded-lg">{String(timeLeft.hours).padStart(2, '0')}h</span>
        <span>:</span>
        <span className="bg-black/20 px-2 py-0.5 rounded-lg">{String(timeLeft.minutes).padStart(2, '0')}m</span>
        <span>:</span>
        <span className="bg-black/20 px-2 py-0.5 rounded-lg">{String(timeLeft.seconds).padStart(2, '0')}s</span>
      </div>
    </div>
  );
}