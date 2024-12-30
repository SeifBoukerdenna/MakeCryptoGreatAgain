// src/hooks/useCharacterConfig.ts

import { useMemo } from "react";
import { charactersConfig } from "../configs/characters.config";
import useCharacterStore from "../stores/useCharacterStore";
import useModeStore from "../stores/useModeStore";
import { getPrompt } from "../utils/obfuscate";

export const useCharacterConfig = () => {
  const selectedCharacter = useCharacterStore(
    (state) => state.selectedCharacter
  );
  const modes = useModeStore((state) => state.modes);

  const currentConfig = useMemo(() => {
    const config = charactersConfig.find(
      (char) => char.name === selectedCharacter
    );
    return config || charactersConfig[0];
  }, [selectedCharacter]);

  const mode = modes[currentConfig.id] || "normal";

  // Get the appropriate prompt based on mode
  const systemPrompt =
    mode === "secret"
      ? getPrompt(currentConfig, true) // Get secondary prompt
      : getPrompt(currentConfig); // Get primary prompt

  return {
    systemPrompt,
    voiceId: currentConfig.voice.id,
    voiceEngine: currentConfig.voice.engine,
    config: currentConfig,
  };
};
