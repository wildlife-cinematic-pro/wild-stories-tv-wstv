// file: lib/recommendations.ts

import type { KlingModel, RealismMode, RunwayModel } from "@/types";

export type DriftLevel = "LOW" | "MEDIUM" | "HIGH";

export type QualityWarning = {
  id: string;
  title: string;
  detail: string;
  severity: "info" | "warning" | "danger";
};

export type QualityRecommended = Partial<{
  realismMode: RealismMode;
  motionOnlyI2V: boolean;
  referenceLock: boolean;
  singleActionRule: boolean;
  microMotion: boolean;
  heroVeo: boolean;
}>;

export type QualityRecommendations = {
  level: DriftLevel;
  warnings: QualityWarning[];
  why: string[];
  recommended: QualityRecommended;
};

export type QualityRecommendationInput = {
  driftRisk: DriftLevel;
  realismMode: RealismMode;
  runwayModel: RunwayModel;
  klingModel: KlingModel;

  motionOnlyI2V: boolean;
  referenceLock: boolean;
  singleActionRule: boolean;
  microMotion: boolean;
  heroVeo: boolean;
};

function isKlingPro(model: KlingModel): boolean {
  return String(model).toLowerCase().includes("pro");
}

function isRunway45(model: RunwayModel): boolean {
  return String(model).includes("4.5");
}

export function getQualityRecommendations(input: QualityRecommendationInput): QualityRecommendations {
  const why: string[] = [];
  const warnings: QualityWarning[] = [];

  const level: DriftLevel = input.driftRisk;

  // Base recommended defaults (safe baseline)
  const recommended: QualityRecommended = {
    realismMode: "Reference Locked",
    motionOnlyI2V: true,
    referenceLock: true,
    singleActionRule: true,
    microMotion: true,
    heroVeo: false,
  };

  // Heuristics (pro-feel)
  if (level === "HIGH") {
    why.push("High drift → lock identity + limit motion scope");
    recommended.realismMode = "Reference Locked";
    recommended.motionOnlyI2V = true;
    recommended.referenceLock = true;
    recommended.singleActionRule = true;
    recommended.microMotion = true;

    warnings.push({
      id: "high-drift",
      severity: "danger",
      title: "HIGH Drift detected",
      detail: "Use Reference Lock + Motion-only I2V + Single Action Rule to keep identity stable.",
    });

    if (!input.referenceLock) {
      warnings.push({
        id: "ref-lock-off",
        severity: "danger",
        title: "Reference Lock is OFF",
        detail: "Turn it ON to prevent subject morphing across shots.",
      });
    }

    if (!input.motionOnlyI2V) {
      warnings.push({
        id: "motion-only-off",
        severity: "warning",
        title: "Motion-only I2V is OFF",
        detail: "Turn it ON so the model does not re-describe appearance every shot.",
      });
    }
  }

  if (level === "MEDIUM") {
    why.push("Medium drift → keep reference lock on, micro-motion on");
    recommended.referenceLock = true;
    recommended.microMotion = true;

    if (!input.referenceLock) {
      warnings.push({
        id: "ref-lock-reco",
        severity: "warning",
        title: "Reference Lock recommended",
        detail: "Medium drift: turning it ON improves consistency.",
      });
    }
  }

  if (level === "LOW") {
    why.push("Low drift → you can relax settings for speed, but lock is still safe.");
    // keep recommended baseline
  }

  // Model-based hints
  if (!isRunway45(input.runwayModel)) {
    warnings.push({
      id: "runway-not-45",
      severity: "info",
      title: "Runway model tip",
      detail: "Gen-4.5 usually gives best realism + prompt adherence for wildlife hero shots.",
    });
  }

  if (!isKlingPro(input.klingModel)) {
    warnings.push({
      id: "kling-not-pro",
      severity: "info",
      title: "Kling model tip",
      detail: "Kling Pro is better for physics + character interaction + multi-shot stability.",
    });
  }

  // If current settings diverge from recommended, add a “quick fix” warning
  const diverged =
    input.realismMode !== recommended.realismMode ||
    input.motionOnlyI2V !== recommended.motionOnlyI2V ||
    input.referenceLock !== recommended.referenceLock ||
    input.singleActionRule !== recommended.singleActionRule ||
    input.microMotion !== recommended.microMotion ||
    input.heroVeo !== recommended.heroVeo;

  if (diverged) {
    warnings.push({
      id: "apply-reco",
      severity: "info",
      title: "Apply Recommended available",
      detail: "Your current settings differ from the recommended safe baseline. Click Apply Recommended.",
    });
  }

  return { level, warnings, why, recommended };
}