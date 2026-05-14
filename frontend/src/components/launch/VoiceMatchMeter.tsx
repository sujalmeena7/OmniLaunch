/* ============================================================
   OmniLaunch — Voice Match Animated Gauge
   ============================================================ */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface VoiceMatchMeterProps {
  score: number; // 0–100
}

const SIZE = 80;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function scoreColor(score: number): string {
  if (score >= 85) return "var(--accent-teal)";
  if (score >= 70) return "var(--accent-amber)";
  return "var(--accent-red)";
}

export default function VoiceMatchMeter({ score }: VoiceMatchMeterProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const color = scoreColor(score);
  const offset = CIRCUMFERENCE - (animatedScore / 100) * CIRCUMFERENCE;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedScore(score);
    }, 50);
    return () => clearTimeout(timeout);
  }, [score]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Background track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="rgba(148, 148, 168, 0.15)"
          strokeWidth={STROKE}
        />
        {/* Foreground arc */}
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
        {/* Center text */}
        <text
          x="50%"
          y="50%"
          dy="0.35em"
          textAnchor="middle"
          fill={color}
          fontSize="18px"
          fontWeight={500}
          fontFamily="var(--font-sans)"
        >
          {Math.round(score)}%
        </text>
      </svg>
      <span
        style={{
          fontSize: "11px",
          color: "var(--text-muted)",
          marginTop: "6px",
          fontFamily: "var(--font-sans)",
        }}
      >
        Voice Match
      </span>
    </div>
  );
}
