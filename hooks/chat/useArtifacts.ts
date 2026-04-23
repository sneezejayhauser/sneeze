"use client";

import { useMemo } from "react";
import { parseArtifacts, type Artifact } from "@/utils/chat/parseArtifacts";

export function useArtifacts(text: string) {
  return useMemo<Artifact[]>(() => parseArtifacts(text), [text]);
}
