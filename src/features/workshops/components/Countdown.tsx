"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const pad = (n: number) => String(n).padStart(2, "0");

// Driven by the SERVER's clock (`closesAtMs - serverNowMs`) and a monotonic
// local timer, so a student's wrong device clock can't show a false deadline.
export function Countdown({ remainingMs }: { remainingMs: number }) {
  const [remaining, setRemaining] = useState(remainingMs);

  useEffect(() => {
    const startedAt = performance.now();
    const id = setInterval(() => {
      setRemaining(Math.max(0, remainingMs - (performance.now() - startedAt)));
    }, 1000);
    return () => clearInterval(id);
  }, [remainingMs]);

  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const expired = totalSeconds === 0;
  const urgent = !expired && totalSeconds <= 60;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border px-4 py-3",
        expired ? "border-red-200 bg-red-50 text-red-700" : urgent ? "border-mauve-300 bg-mauve-50 text-mauve-600" : "border-primary-100 bg-mint-50 text-primary-700"
      )}
    >
      <span className="flex items-center gap-2 text-sm font-medium">
        <Clock aria-hidden className="h-4 w-4" />
        {expired ? "انتهى وقت التسجيل" : "الوقت المتبقي للتسجيل"}
      </span>
      {/* Announced only at minute marks and in the last 10 seconds, never every second. */}
      <span className="text-lg font-bold tabular-nums" dir="ltr" aria-hidden>
        {pad(minutes)}:{pad(seconds)}
      </span>
      <span className="sr-only" role="status" aria-live="polite">
        {expired ? "انتهى وقت التسجيل" : seconds === 0 || totalSeconds <= 10 ? `متبقي ${minutes} دقيقة و${seconds} ثانية` : ""}
      </span>
    </div>
  );
}
