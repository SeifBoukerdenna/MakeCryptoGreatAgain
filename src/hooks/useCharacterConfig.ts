import { useMemo } from "react";
// @ts-ignore
import { charactersConfig } from "../configs/characters.config";
import useCharacterStore from "../stores/useCharacterStore";
import useModeStore from "../stores/useModeStore";

export const useCharacterConfig = () => {
  const selectedCharacter = useCharacterStore(
    (state) => state.selectedCharacter
  );
  const modes = useModeStore((state) => state.modes);

  const currentConfig = useMemo(() => {
    const config = charactersConfig.find(
      // @ts-ignore
      (char) => char.name === selectedCharacter
    );
    return config || charactersConfig[0];
  }, [selectedCharacter]);

  const mode = modes[currentConfig.id] || "normal";
  const systemPrompt =
    mode === "secret"
      ? currentConfig.secondarySystemPrompt
      : currentConfig.systemPrompt;

  return {
    systemPrompt,
    voiceId: currentConfig.voice.id,
    voiceEngine: currentConfig.voice.engine,
    config: currentConfig,
  };
};
