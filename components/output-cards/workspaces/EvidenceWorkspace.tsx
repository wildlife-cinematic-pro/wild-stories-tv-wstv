"use client";

import { RealGenerationEvidencePanel } from "@/components/output-cards/evidence-panel";

import type { GeneratedPackage } from "@/types";

export function EvidenceWorkspace({ data }: { data: GeneratedPackage }) {
  return (
    <RealGenerationEvidencePanel
      key={data.generationId ?? `${data.predatorName ?? ""}|${data.preyName ?? ""}|${String(data.arcName ?? "")}|${data.generatedAt ?? ""}`}
      data={data}
    />
  );
}
