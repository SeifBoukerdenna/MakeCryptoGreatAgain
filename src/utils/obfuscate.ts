// src/utils/obfuscate.ts

const generateKey = () => {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 256));
};

const xorEncrypt = (str: string, key: number[]): string => {
  const encoded = str
    .split("")
    .map((char, i) => {
      const charCode = char.charCodeAt(0);
      const keyByte = key[i % key.length];
      return (charCode ^ keyByte).toString(16).padStart(2, "0");
    })
    .join("");

  return encoded;
};

const xorDecrypt = (encoded: string, key: number[]): string => {
  const bytes = encoded.match(/.{1,2}/g) || [];
  return bytes
    .map((byte, i) => {
      const charCode = parseInt(byte, 16);
      const keyByte = key[i % key.length];
      return String.fromCharCode(charCode ^ keyByte);
    })
    .join("");
};

const obfuscateConfig = (config: any): any => {
  const key = generateKey();
  const keyStr = key.join(",");

  return {
    ...config,
    systemPrompt: {
      encrypted: xorEncrypt(config.systemPrompt, key),
      key: keyStr,
    },
    secondarySystemPrompt: {
      encrypted: xorEncrypt(config.secondarySystemPrompt, key),
      key: keyStr,
    },
  };
};

const deobfuscatePrompt = (encryptedData: {
  encrypted: string;
  key: string;
}): string => {
  const key = encryptedData.key.split(",").map(Number);
  return xorDecrypt(encryptedData.encrypted, key);
};

export const obfuscateCharacterConfig = (config: any[]): any[] => {
  return config.map((character) => obfuscateConfig(character));
};

export const getPrompt = (
  character: any,
  isSecondary: boolean = false
): string => {
  const promptData = isSecondary
    ? character.secondarySystemPrompt
    : character.systemPrompt;
  return deobfuscatePrompt(promptData);
};
