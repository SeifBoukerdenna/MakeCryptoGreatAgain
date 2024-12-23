export const formatTimeRemaining = (milliseconds: number) => {
  const minutes = Math.floor(milliseconds / (60 * 1000));
  const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};
