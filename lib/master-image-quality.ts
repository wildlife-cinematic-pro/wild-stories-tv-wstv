export type MasterImageQualityInput = {
  prompt: string;
  predatorName?: string;
  preyName?: string;
  environmentName?: string;
};

export type MasterImageQualityReport = {
  score: number;
  passed: boolean;
  checks: {
    id: string;
    label: string;
    passed: boolean;
    severity: "info" | "warning" | "danger";
    fix: string;
  }[];
  summary: string;
};

type CheckDefinition = {
  id: string;
  label: string;
  passed: boolean;
  severity: "info" | "warning" | "danger";
  fix: string;
  penalty: number;
};

function normalizePrompt(input: string): string {
  return String(input ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function promptHas(text: string, pattern: RegExp): boolean {
  return pattern.test(text.toLowerCase());
}

export function evaluateMasterImagePrompt(
  input: MasterImageQualityInput
): MasterImageQualityReport {
  const prompt = normalizePrompt(input.prompt);
  const lower = prompt.toLowerCase();

  const checks: CheckDefinition[] = [
    {
      id: "composition-framing",
      label: "Clear composition framing",
      passed: promptHas(lower, /\b(frame|framing|composition|thumbnail-safe|cover-safe|full[- ]body|full body|fully readable)\b/),
      severity: "danger",
      fix: "Add clear composition and framing language.",
      penalty: 18,
    },
    {
      id: "full-body",
      label: "Full-body visibility",
      passed: promptHas(lower, /\bfull[- ]body\b|\bfull body\b|\bfull bodies\b/),
      severity: "danger",
      fix: "State that both animals stay full-body visible or fully readable.",
      penalty: 16,
    },
    {
      id: "grounded-contact",
      label: "Grounded paw/hoof/foot contact",
      passed: promptHas(lower, /\bgrounded\b.*\bcontact\b|\bhoof contact\b|\bpaw contact\b|\bfoot contact\b/),
      severity: "danger",
      fix: "Add grounded paw, hoof, or foot contact.",
      penalty: 14,
    },
    {
      id: "spacing-lane",
      label: "Clean spacing or open reaction lane",
      passed: promptHas(lower, /\bclean spacing\b|\bopen reaction lane\b|\bopen attack\/escape corridor\b|\bopen lane\b/),
      severity: "warning",
      fix: "Add clean spacing or one open reaction lane.",
      penalty: 10,
    },
    {
      id: "thumbnail-read",
      label: "Readable first-frame / thumbnail-safe composition",
      passed: promptHas(lower, /\bthumbnail-safe\b|\bfirst-frame\b|\breadable composition\b|\breadable frame\b/),
      severity: "warning",
      fix: "Add first-frame readability or thumbnail-safe composition wording.",
      penalty: 8,
    },
    {
      id: "anatomy-scale",
      label: "Animal scale and anatomy stability",
      passed: promptHas(lower, /\bstable anatomy\b|\banatomy stability\b|\bscale\b|\bbody mass\b/),
      severity: "danger",
      fix: "Mention stable anatomy and readable scale or body mass.",
      penalty: 14,
    },
    {
      id: "habitat-continuity",
      label: "Habitat continuity",
      passed:
        promptHas(lower, /\bhabitat\b|\benvironment\b|\bterrain\b|\bcontinuity\b/) ||
        (!!input.environmentName &&
          lower.includes(String(input.environmentName).toLowerCase())),
      severity: "warning",
      fix: "Lock the habitat or environment continuity in the prompt.",
      penalty: 8,
    },
    {
      id: "safety",
      label: "No-gore / no visible wounds safety",
      passed: promptHas(lower, /\bno blood\b|\bno gore\b|\bno visible wounds\b/),
      severity: "danger",
      fix: "Add no blood, no gore, and no visible wounds.",
      penalty: 14,
    },
    {
      id: "dust-control",
      label: "Dust-free consistency when requested",
      passed:
        !promptHas(lower, /\bdust-free\b|\bno dust\b/) ||
        !promptHas(lower, /\bdust\b|\bdirt spray\b|\bdust cloud\b/),
      severity: "warning",
      fix: "Remove dust language when the prompt asks for dust-free or no-dust output.",
      penalty: 6,
    },
    {
      id: "still-image-discipline",
      label: "Avoids excessive action for a still image",
      passed: !promptHas(lower, /\bexplosion\b|\bmid-air spin\b|\bflying toward camera\b|\bmultiple impacts\b|\bseveral actions\b/),
      severity: "warning",
      fix: "Reduce the still-image action to one readable pre-motion beat.",
      penalty: 8,
    },
  ];

  const score = checks.reduce(
    (total, check) => (check.passed ? total : total - check.penalty),
    100
  );

  const failedDanger = checks.some(
    (check) => !check.passed && check.severity === "danger"
  );

  const passed = score >= 80 && !failedDanger;
  const failedLabels = checks
    .filter((check) => !check.passed)
    .slice(0, 3)
    .map((check) => check.label.toLowerCase());

  return {
    score: Math.max(0, score),
    passed,
    checks: checks.map((check) => ({
      id: check.id,
      label: check.label,
      passed: check.passed,
      severity: check.severity,
      fix: check.fix,
    })),
    summary: passed
      ? "Master image prompt is production-safe and ready for reference generation."
      : failedLabels.length
        ? `Master image prompt needs work on ${failedLabels.join(", ")}.`
        : "Master image prompt needs revision before generation.",
  };
}

export function getMasterImageFixPrompt(
  report: MasterImageQualityReport
): string {
  const fixes = report.checks
    .filter((check) => !check.passed)
    .map((check) => check.fix);

  if (!fixes.length) {
    return "Keep full-body readability, grounded contact, habitat continuity, clean composition, and no-gore safety.";
  }

  return `Revise the master image prompt: ${fixes.join(" ")}`;
}
