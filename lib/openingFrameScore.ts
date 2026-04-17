import type { OpeningFrameScore } from "@/types";

export interface OpeningFrameInput {
  fullBodyReadable: boolean;
  threatReadable: boolean;
  subjectSeparation: boolean;
  environmentClear: boolean;
  emotionalReadImmediate: boolean;
}

export function scoreOpeningFrame(input: OpeningFrameInput): OpeningFrameScore {
  let total = 0;
  if (input.fullBodyReadable) total += 20;
  if (input.threatReadable) total += 20;
  if (input.subjectSeparation) total += 20;
  if (input.environmentClear) total += 20;
  if (input.emotionalReadImmediate) total += 20;

  let summary = 'Weak opening frame.';
  if (total >= 80) summary = 'Strong first-frame stop power.';
  else if (total >= 60) summary = 'Usable opening frame, but could be stronger.';

  return { total, summary };
}
