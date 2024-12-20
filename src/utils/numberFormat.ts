// src/utils/numberFormat.ts

export const formatToK = (num: number): string => {
  if (num >= 1000) {
    const formatted = (num / 1000).toFixed(1);
    // Remove .0 if it exists
    return `${formatted.endsWith(".0") ? formatted.slice(0, -2) : formatted}k`;
  }
  return num.toString();
};
