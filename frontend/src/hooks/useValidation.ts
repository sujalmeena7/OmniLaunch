/* ============================================================
   OmniLaunch — Real-time Validation Hook
   ============================================================ */

import { useMemo } from "react";
import type { PlatformRule } from "@/types";

export interface FieldStatus {
  count: number;
  max: number;
  status: "ok" | "warning" | "over";
}

export interface ForbiddenWordsStatus {
  found: string[];
  status: "ok" | "fail";
}

export interface ValidationResult {
  titleLength: FieldStatus;
  bodyLength: FieldStatus;
  hasForbiddenWords: ForbiddenWordsStatus;
  platformSpecific: Record<string, string[]>;
}

function computeFieldStatus(count: number, max: number): FieldStatus {
  if (count > max) {
    return { count, max, status: "over" };
  }
  if (count > max * 0.85) {
    return { count, max, status: "warning" };
  }
  return { count, max, status: "ok" };
}

function findForbiddenWords(text: string, wordList: string[]): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  for (const word of wordList) {
    const trimmed = word.trim().toLowerCase();
    if (trimmed && lower.includes(trimmed)) {
      found.add(word);
    }
  }
  return Array.from(found);
}

function effectiveTitleMax(rule: PlatformRule): number {
  const prefixLen = rule.prefix ? rule.prefix.length : 0;
  return (rule.max_title_length ?? Infinity) - prefixLen;
}

function effectiveBodyMax(rule: PlatformRule): number {
  return rule.max_body_length ?? Infinity;
}

export function useValidation(
  productName: string,
  description: string,
  selectedPlatforms: string[],
  platformRules: PlatformRule[]
): ValidationResult {
  return useMemo(() => {
    const activeRules = platformRules.filter((r) =>
      selectedPlatforms.includes(r.platform)
    );

    // ── Title / Body limits (most restrictive active platform) ──
    const titleMax = activeRules.length
      ? Math.min(...activeRules.map(effectiveTitleMax))
      : 300;
    const bodyMax = activeRules.length
      ? Math.min(...activeRules.map(effectiveBodyMax))
      : 5000;

    const titleLength = computeFieldStatus(productName.length, titleMax);
    const bodyLength = computeFieldStatus(description.length, bodyMax);

    // ── Forbidden words (union across selected platforms) ──
    const allForbidden = Array.from(
      new Set(activeRules.flatMap((r) => r.forbidden_words))
    );
    const foundInTitle = findForbiddenWords(productName, allForbidden);
    const foundInBody = findForbiddenWords(description, allForbidden);
    const foundForbidden = Array.from(new Set([...foundInTitle, ...foundInBody]));

    const hasForbiddenWords: ForbiddenWordsStatus =
      foundForbidden.length > 0
        ? { found: foundForbidden, status: "fail" }
        : { found: [], status: "ok" };

    // ── Platform-specific warnings ──
    const platformSpecific: Record<string, string[]> = {};
    for (const rule of activeRules) {
      const warnings: string[] = [];
      const tMax = effectiveTitleMax(rule);
      const bMax = effectiveBodyMax(rule);

      if (productName.length > tMax) {
        warnings.push(
          `Title exceeds ${rule.max_title_length} characters (including prefix)`
        );
      } else if (productName.length > tMax * 0.9) {
        warnings.push(
          `Title nearing ${rule.max_title_length}-character limit`
        );
      }

      if (description.length > bMax) {
        warnings.push(
          `Body exceeds ${rule.max_body_length}-character limit`
        );
      } else if (description.length > bMax * 0.9) {
        warnings.push(
          `Body nearing ${rule.max_body_length}-character limit`
        );
      }

      const platForbidden = findForbiddenWords(
        `${productName} ${description}`,
        rule.forbidden_words
      );
      if (platForbidden.length > 0) {
        warnings.push(
          `Contains forbidden words: ${platForbidden.join(", ")}`
        );
      }

      if (rule.platform === "twitter") {
        const combined = productName.length + description.length;
        const twMax = rule.max_title_length ?? 280;
        if (combined > twMax) {
          warnings.push(
            `Combined title + body exceeds ${twMax} characters (${combined}/${twMax})`
          );
        }
      }

      if (warnings.length > 0) {
        platformSpecific[rule.platform] = warnings;
      }
    }

    return {
      titleLength,
      bodyLength,
      hasForbiddenWords,
      platformSpecific,
    };
  }, [productName, description, selectedPlatforms, platformRules]);
}
