// src/hooks/useCharacterConfig.ts

import { useMemo } from "react";
import { charactersConfig } from "../configs/characters.config";
import useCharacterStore from "../stores/useCharacterStore";

export const useCharacterConfig = () => {
  const selectedCharacter = useCharacterStore(
    (state) => state.selectedCharacter
  );

  const currentConfig = useMemo(() => {
    // Find the character configuration that matches the selected character name exactly
    const config = charactersConfig.find(
      (char) => char.name === selectedCharacter
    );

    // Fall back to the first character (Trump) if no match is found
    return config || charactersConfig[0];
  }, [selectedCharacter]);

  return {
    systemPrompt: currentConfig.systemPrompt,
    voiceId: currentConfig.voice.id,
    voiceEngine: currentConfig.voice.engine,
    config: currentConfig,
  };
};
