// src/hooks/useCharacterSelection.ts

import { useRef, useEffect } from "react";
import SwiperCore from "swiper";
import { characters } from "../characters";
import useCharacterStore from "../stores/useCharacterStore";

export const useCharacterSelection = () => {
  const selectedCharacter = useCharacterStore(
    (state) => state.selectedCharacter
  );
  const setSelectedCharacter = useCharacterStore(
    (state) => state.setSelectedCharacter
  );
  const swiperRef = useRef<SwiperCore>();

  const selectedIndex = characters.findIndex(
    (char) => char.name === selectedCharacter
  );

  useEffect(() => {
    if (swiperRef.current && selectedIndex !== -1) {
      swiperRef.current.slideToLoop(selectedIndex, 500);
    }
  }, [selectedCharacter, selectedIndex]);

  const getSelectedCharacter = () => {
    return characters.find((char) => char.name === selectedCharacter);
  };

  return {
    selectedCharacter,
    setSelectedCharacter,
    swiperRef,
    selectedIndex,
    getSelectedCharacter,
    characters,
  };
};
