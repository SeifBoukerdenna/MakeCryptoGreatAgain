// src/hooks/useCharacterSelection.ts

import { useRef } from "react";
import SwiperCore from "swiper";
import { charactersConfig } from "../configs/characters.config";
import useCharacterStore from "../stores/useCharacterStore";

export const useCharacterSelection = () => {
  const selectedCharacter = useCharacterStore(
    (state) => state.selectedCharacter
  );
  const setSelectedCharacter = useCharacterStore(
    (state) => state.setSelectedCharacter
  );
  const swiperRef = useRef<SwiperCore>();

  // Find the index of the selected character
  const selectedIndex = charactersConfig.findIndex(
    (char) => char.name === selectedCharacter
  );

  const getSelectedCharacter = () => {
    return charactersConfig.find((char) => char.name === selectedCharacter);
  };

  return {
    selectedCharacter,
    setSelectedCharacter,
    swiperRef,
    selectedIndex,
    getSelectedCharacter,
    characters: charactersConfig, // Use the config array as the characters list
  };
};
