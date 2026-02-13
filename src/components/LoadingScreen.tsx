import { useState, useEffect } from "react";

const LoadingScreen = () => {
  const [phase, setPhase] = useState<"center" | "moving" | "done">("center");

  useEffect(() => {
    // Show centered logo briefly
    const t1 = setTimeout(() => setPhase("moving"), 1200);
    const t2 = setTimeout(() => setPhase("done"), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-background flex items-center justify-center transition-opacity duration-500 ${
        phase === "moving" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div
        className={`font-display text-4xl md:text-5xl font-bold text-foreground transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          phase === "moving"
            ? "scale-50 -translate-x-[calc(50vw-100px)] -translate-y-[calc(50vh-40px)]"
            : "scale-100 translate-x-0 translate-y-0"
        }`}
      >
        TrendZone
      </div>
    </div>
  );
};

export default LoadingScreen;
