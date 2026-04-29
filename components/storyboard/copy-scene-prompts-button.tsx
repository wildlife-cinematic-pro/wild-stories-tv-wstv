"use client";

import CopyButton from "@/components/storyboard/copy-button";

type CopyScenePromptsButtonProps = {
  sceneId: number;
  text: string;
};

export default function CopyScenePromptsButton({
  sceneId,
  text,
}: CopyScenePromptsButtonProps) {
  return (
    <CopyButton
      text={text}
      label={`Scene ${String(sceneId).padStart(2, "0")} Prompts`}
      size="md"
    />
  );
}
