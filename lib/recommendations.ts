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

  const recommended: QualityRecommended = {
    realismMode: "Reference Locked",
    motionOnlyI2V: true,
    referenceLock: true,
    singleActionRule: true,
    microMotion: true,
    heroVeo: false,
  };

  if (level === "HIGH") {
    why.push("High drift → lock identity, simplify motion, and protect opening readability");
    recommended.realismMode = "Reference Locked";
    recommended.motionOnlyI2V = true;
    recommended.referenceLock = true;
    recommended.singleActionRule = true;
    recommended.microMotion = true;

    warnings.push({
      id: "high-drift",
      severity: "danger",
      title: "HIGH Drift detected",
      detail: "Use Reference Lock + Motion-only I2V + Single Action Rule to keep identity stable, spacing clear, and the opening readable.",
    });

    if (!input.referenceLock) {
      warnings.push({
        id: "ref-lock-off",
        severity: "danger",
        title: "Reference Lock is OFF",
        detail: "Turn it ON to prevent subject morphing, silhouette drift, and weak first-frame clarity across shots.",
      });
    }

    if (!input.motionOnlyI2V) {
      warnings.push({
        id: "motion-only-off",
        severity: "warning",
        title: "Motion-only I2V is OFF",
        detail: "Turn it ON so the model does not re-describe appearance every shot and weaken motion clarity.",
      });
    }
  }

  if (level === "MEDIUM") {
    why.push("Medium drift → keep reference lock on, preserve clear openings, and keep micro-motion controlled");
    recommended.referenceLock = true;
    recommended.microMotion = true;

    if (!input.referenceLock) {
      warnings.push({
        id: "ref-lock-reco",
        severity: "warning",
        title: "Reference Lock recommended",
        detail: "Medium drift: turning it ON improves consistency, spacing stability, and subject readability.",
      });
    }
  }

  if (level === "LOW") {
    why.push("Low drift → you can relax settings for speed, but clear openings and lock are still safer.");
  }

  if (warnings.length === 0 && level !== "HIGH") {
    if (!isRunway45(input.runwayModel)) {
      warnings.push({
        id: "runway-not-45",
        severity: "info",
        title: "Runway model tip",
        detail: "Gen-4.5 usually gives the strongest realism, first-frame readability, and prompt adherence for wildlife hero shots.",
      });
    }

    if (!isKlingPro(input.klingModel)) {
      warnings.push({
        id: "kling-not-pro",
        severity: "info",
        title: "Kling model tip",
        detail: "Kling Pro is usually better for physics, character interaction, and readable multi-shot stability.",
      });
    }
  }

  const criticalDiverged =
    input.motionOnlyI2V !== recommended.motionOnlyI2V ||
    input.referenceLock !== recommended.referenceLock ||
    input.singleActionRule !== recommended.singleActionRule;

  if ((level === "MEDIUM" || level === "HIGH") && criticalDiverged) {
    warnings.push({
      id: "apply-reco",
      severity: "info",
      title: "Apply Recommended available",
      detail: "Your current settings differ from the safer baseline. Click Apply Recommended to restore stronger clarity and stability.",
    });
  }

  return { level, warnings, why, recommended };
}