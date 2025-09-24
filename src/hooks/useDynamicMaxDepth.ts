import { useState, useEffect, useRef } from 'react';

export function useDynamicMaxDepth() {
  const [maxDepth, setMaxDepth] = useState(5);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculateMaxDepth = (width: number) => {
      if (width < 500) return 2;
      if (width < 800) return 4;
      return 5;
    };

    const updateMaxDepth = () => {
      const width = window.innerWidth;
      const newMaxDepth = calculateMaxDepth(width);
      setMaxDepth(newMaxDepth);
    };

    // Initial calculation
    updateMaxDepth();

    // Listen to window resize
    window.addEventListener('resize', updateMaxDepth);

    return () => {
      window.removeEventListener('resize', updateMaxDepth);
    };
  }, []);

  return { maxDepth, containerRef };
}
