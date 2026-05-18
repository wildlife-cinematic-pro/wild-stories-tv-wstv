import { notFound } from "next/navigation";
import JlptN2App from "@/components/jlpt-n2/JlptN2App";

const viewMap = {
  today: "today",
  vocabulary: "vocabulary",
  kanji: "kanji",
  grammar: "grammar",
  reading: "reading",
  listening: "listening",
  "mock-tests": "mock test",
  "exam-mode": "exam-mode",
  "repair-plan": "repair-plan",
  mistakes: "mistakes",
  srs: "srs",
  settings: "settings",
} as const;

export default async function JlptN2ViewPage({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params;
  const initialView = viewMap[view as keyof typeof viewMap];
  if (!initialView) notFound();
  return <JlptN2App initialView={initialView} />;
}
