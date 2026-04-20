"use client";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

type Direction = "up" | "left" | "right";

interface Props {
  children: React.ReactNode;
  className?: string;
  direction?: Direction;
  delay?: number;
}

const dirClass: Record<Direction, string> = {
  up: "fade-up",
  left: "fade-left",
  right: "fade-right",
};

export default function AnimatedSection({
  children,
  className = "",
  direction = "up",
  delay = 0,
}: Props) {
  const { ref, visible } = useScrollAnimation();

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`${dirClass[direction]} ${visible ? "in-view" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
