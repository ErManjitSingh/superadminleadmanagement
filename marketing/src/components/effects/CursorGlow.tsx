"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function CursorGlow() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!visible) setVisible(true);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [visible]);

  if (!visible) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-30 hidden lg:block"
      animate={{ x: position.x - 200, y: position.y - 200 }}
      transition={{ type: "spring", damping: 30, stiffness: 200, mass: 0.5 }}
    >
      <div className="h-[400px] w-[400px] rounded-full bg-gradient-radial from-blue-500/10 via-violet-500/5 to-transparent blur-3xl" />
    </motion.div>
  );
}
