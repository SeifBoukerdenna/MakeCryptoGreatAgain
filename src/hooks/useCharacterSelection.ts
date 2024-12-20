// src/hooks/useCharacterSelection.ts

import { useRef, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import SwiperCore from "swiper";
import { charactersConfig } from "../configs/characters.config";
import useCharacterStore from "../stores/useCharacterStore";

export const useCharacterSelection = () => {
  const { connected } = useWallet();
  const selectedCharacter = useCharacterStore(
    (state) => state.selectedCharacter
  );
  const setSelectedCharacter = useCharacterStore(
    (state) => state.setSelectedCharacter
  );
  const swiperRef = useRef<SwiperCore>();

  // Reset selection when wallet disconnects
  useEffect(() => {
    if (!connected) {
      setSelectedCharacter(null);
    }
  }, [connected, setSelectedCharacter]);

  const selectedIndex = selectedCharacter
    ? charactersConfig.findIndex((char) => char.name === selectedCharacter)
    : -1;

  const getSelectedCharacter = () => {
    return selectedCharacter
      ? charactersConfig.find((char) => char.name === selectedCharacter)
      : null;
  };

  return {
    selectedCharacter,
    setSelectedCharacter,
    swiperRef,
    selectedIndex,
    getSelectedCharacter,
    characters: charactersConfig,
  };
};
