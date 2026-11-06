import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/theme/theme-context";

/**
 * CustomCursor - Cursor circular fluido con seguimiento al ratón.
 * Se desactiva automáticamente en dispositivos táctiles.
 */
export function CustomCursor() {
  const { theme } = useTheme();
  const [enabled, setEnabled] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [cursorState, setCursorState] = useState<"default" | "hover" | "clicked">("default");
  const [isVisible, setIsVisible] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfigRing = { damping: 26, stiffness: 260, mass: 0.45 };
  const smoothX = useSpring(mouseX, springConfigRing);
  const smoothY = useSpring(mouseY, springConfigRing);

  const springConfigDot = { damping: 35, stiffness: 700, mass: 0.15 };
  const dotX = useSpring(mouseX, springConfigDot);
  const dotY = useSpring(mouseY, springConfigDot);

  useEffect(() => {
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(isFinePointer && !prefersReducedMotion);

    const checkDark = () => {
      const darkActive =
        theme === "dark" ||
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches) ||
        document.documentElement.classList.contains("dark");
      setIsDark(darkActive);
    };
    checkDark();
  }, [theme]);

  useEffect(() => {
    if (!enabled) return;

    let isMouseDown = false;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = Boolean(
          target.closest(
            'a, button, input, select, textarea, [role="button"], [role="link"], [data-interactive="true"], .interactive-cursor, [tabindex="0"]',
          ),
        );
        if (isMouseDown) {
          setCursorState("clicked");
        } else if (isInteractive) {
          setCursorState("hover");
        } else {
          setCursorState("default");
        }
      }
    };

    const handleMouseDown = () => {
      isMouseDown = true;
      setCursorState("clicked");
    };

    const handleMouseUp = (e: MouseEvent) => {
      isMouseDown = false;
      const target = e.target as HTMLElement | null;
      const isInteractive = Boolean(
        target?.closest(
          'a, button, input, select, textarea, [role="button"], [role="link"], [data-interactive="true"], .interactive-cursor',
        ),
      );
      setCursorState(isInteractive ? "hover" : "default");
    };

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseenter", handleMouseEnter);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [enabled, isVisible, mouseX, mouseY]);

  if (!enabled) return null;

  const ringVariants = {
    default: {
      width: 32,
      height: 32,
      borderColor: isDark ? "rgba(52, 211, 153, 0.75)" : "rgba(16, 185, 129, 0.65)",
      backgroundColor: isDark ? "rgba(16, 185, 129, 0.04)" : "rgba(16, 185, 129, 0.03)",
      boxShadow: isDark ? "0 0 14px rgba(16, 185, 129, 0.25)" : "0 0 10px rgba(16, 185, 129, 0.15)",
    },
    hover: {
      width: 52,
      height: 52,
      borderColor: isDark ? "rgba(52, 211, 153, 0.95)" : "rgba(5, 150, 105, 0.9)",
      backgroundColor: isDark ? "rgba(16, 185, 129, 0.16)" : "rgba(16, 185, 129, 0.1)",
      boxShadow: isDark
        ? "0 0 28px rgba(16, 185, 129, 0.5), inset 0 0 12px rgba(16, 185, 129, 0.2)"
        : "0 0 20px rgba(16, 185, 129, 0.35), inset 0 0 8px rgba(16, 185, 129, 0.15)",
    },
    clicked: {
      width: 26,
      height: 26,
      borderColor: isDark ? "rgba(110, 231, 183, 1)" : "rgba(4, 120, 87, 1)",
      backgroundColor: isDark ? "rgba(16, 185, 129, 0.35)" : "rgba(16, 185, 129, 0.25)",
      boxShadow: isDark ? "0 0 20px rgba(16, 185, 129, 0.6)" : "0 0 14px rgba(16, 185, 129, 0.4)",
    },
  };

  const dotVariants = {
    default: {
      opacity: 0.95,
      backgroundColor: isDark ? "#34d399" : "#059669",
      boxShadow: isDark ? "0 0 8px #10b981" : "0 0 6px #059669",
    },
    hover: {
      opacity: 0,
      backgroundColor: isDark ? "#6ee7b7" : "#10b981",
    },
    clicked: {
      opacity: 1,
      scale: 1.4,
      backgroundColor: isDark ? "#a7f3d0" : "#34d399",
      boxShadow: "0 0 16px #34d399",
    },
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[999999] overflow-hidden"
        >
          <motion.div
            style={{
              x: smoothX,
              y: smoothY,
              translateX: "-50%",
              translateY: "-50%",
            }}
            variants={ringVariants}
            animate={cursorState}
            transition={{ type: "spring", damping: 20, stiffness: 350 }}
            className="fixed left-0 top-0 rounded-full border border-emerald-400"
          />
          <motion.div
            style={{
              x: dotX,
              y: dotY,
              translateX: "-50%",
              translateY: "-50%",
            }}
            variants={dotVariants}
            animate={cursorState}
            transition={{ duration: 0.15 }}
            className="fixed left-0 top-0 h-1.5 w-1.5 rounded-full"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}