// src/hooks/useIsChromium.ts

import { useState, useEffect } from "react";

const useIsChromium = (): boolean => {
  const [isChromium, setIsChromium] = useState<boolean>(false);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isChromiumBased =
      /Chrom(e|ium)/.test(userAgent) && !/OPR|Edg|Brave/.test(userAgent);
    setIsChromium(isChromiumBased);
  }, []);

  return isChromium;
};

export default useIsChromium;
