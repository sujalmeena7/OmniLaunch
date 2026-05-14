"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface GeneratingStateProps {
  bundleId: string | null;
  currentStep?: number;
}

const STEPS = [
  { label: "Researching", description: "Deep-diving into your product's DNA..." },
  { label: "Drafting", description: "Crafting platform-native narratives..." },
  { label: "Humanizing", description: "Infusing your unique voice & style..." },
  { label: "Complete", description: "Your launch bundle is ready." },
];

export default function GeneratingState({
  bundleId,
  currentStep = 0,
}: GeneratingStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ height: "100%", gap: "24px" }}
    >
      {/* Steps */}
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const isCompleted = i < currentStep;
          const isActive = i === currentStep;

          return (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center" style={{ minWidth: "80px" }}>
                {/* Icon */}
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: "24px",
                    height: "24px",
                  }}
                >
                  {isCompleted ? (
                    <Check size={14} style={{ color: "var(--accent-lime)" }} />
                  ) : isActive ? (
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "var(--accent-lime)",
                          boxShadow: "0 0 10px var(--accent-lime)",
                        }}
                      />
                    </motion.div>
                  ) : (
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "var(--border-default)",
                      }}
                    />
                  )}
                </div>

                {/* Label */}
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    marginTop: "6px",
                    color: isActive
                      ? "var(--accent-lime)"
                      : isCompleted
                      ? "var(--text-muted)"
                      : "var(--text-muted)",
                  }}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector */}
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    width: "32px",
                    height: "1px",
                    background: "var(--border-subtle)",
                    margin: "0 4px",
                    marginBottom: "18px",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Description */}
      <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
        {STEPS[currentStep]?.description}
      </span>

      {/* Bundle ID */}
      {bundleId && (
        <span
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            fontFamily: "monospace",
          }}
        >
          {bundleId}
        </span>
      )}
    </div>
  );
}
