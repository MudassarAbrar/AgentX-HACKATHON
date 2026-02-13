import { useState, useEffect } from "react";

const LoadingScreen = () => {
  const [phase, setPhase] = useState<"reveal" | "move" | "done">("reveal");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("move"), 1400);
    const t2 = setTimeout(() => setPhase("done"), 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-background flex items-center justify-center"
      style={{
        opacity: phase === "move" ? 0 : 1,
        transition: "opacity 0.8s ease 0.6s",
        pointerEvents: phase === "move" ? "none" : "auto",
      }}
    >
      <div
        className="font-display font-bold"
        style={{
          fontSize: phase === "move" ? "1.5rem" : "clamp(2.5rem, 5vw, 4rem)",
          transition: "all 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
          transform: phase === "move"
            ? "translate(calc(-50vw + 120px), calc(-50vh + 52px)) scale(0.6)"
            : "translate(0, 0) scale(1)",
          color: "hsl(var(--foreground))",
          backgroundImage: phase === "reveal"
            ? "linear-gradient(90deg, hsl(var(--foreground)) 50%, hsl(var(--muted-foreground)) 50%)"
            : "none",
          backgroundSize: "200% 100%",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: phase === "reveal" ? "transparent" : "hsl(var(--foreground))",
          animation: phase === "reveal" ? "text-color-reveal 1.2s ease forwards" : "none",
        }}
      >
        TrendZone
      </div>
    </div>
  );
};

export default LoadingScreen;
