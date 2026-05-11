/**
 * MINDR AI — shared animation variants and transitions.
 *
 * Import from here instead of defining inline so motion feels
 * consistent across every page. framer-motion cannot interpolate
 * CSS custom properties, so colors are hex here — update both
 * this file and globals.css if the brand colour ever changes.
 */

import type { Variants, Transition } from "framer-motion";

// ── Design token mirrors (hex only — needed for Motion interpolation) ─────────

const BRAND         = "#E91E8C";   // --color-brand
const TEXT_PRIMARY  = "#F4F4F5";   // --color-text-primary
const BORDER_REST   = "rgba(255,255,255,0.06)";
const BORDER_HOVER  = "rgba(233,30,140,0.32)";

// ── Base transitions ──────────────────────────────────────────────────────────

/** Standard UI motion — the default for most interactive elements. */
export const transSmooth: Transition = {
  type: "tween",
  ease: [0.4, 0.0, 0.2, 1],
  duration: 0.18,
};

/** Micro-interaction — hover pop, icon scale. Fast enough not to feel sluggish. */
export const transFast: Transition = {
  type: "tween",
  ease: [0.4, 0.0, 0.2, 1],
  duration: 0.10,
};

/** Spring — panel slides, drawer reveals. Physics feel. */
export const transSpring: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 28,
  mass: 0.8,
};

// ── KPI card hover ────────────────────────────────────────────────────────────

export const kpiCard: Variants = {
  rest: {
    scale: 1,
    borderColor: BORDER_REST,
    transition: transFast,
  },
  hover: {
    scale: 1.018,
    borderColor: BORDER_HOVER,
    transition: transFast,
  },
};

export const kpiValue: Variants = {
  rest: {
    color: TEXT_PRIMARY,
    scale: 1,
    transition: transSmooth,
  },
  hover: {
    color: BRAND,
    scale: 1.05,
    transition: transSmooth,
  },
};

/**
 * Scale-only hover — for KPI values that already carry a semantic colour
 * (e.g. SLA Compliance in brand magenta, Availability in resolved-teal).
 * Preserves the element's CSS colour; only animates scale.
 */
export const kpiValueScale: Variants = {
  rest:  { scale: 1,    transition: transSmooth },
  hover: { scale: 1.05, transition: transSmooth },
};

// ── Page / section entry ──────────────────────────────────────────────────────

export const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0,  transition: transSmooth },
};

// ── Stagger list ──────────────────────────────────────────────────────────────

export const staggerContainer: Variants = {
  hidden:  {},
  visible: {
    transition: { staggerChildren: 0.055, delayChildren: 0.04 },
  },
};

export const staggerItem: Variants = {
  hidden:  { opacity: 0, y: 8  },
  visible: { opacity: 1, y: 0, transition: transSmooth },
};

// ── Inline expand / collapse (AnimatePresence) ────────────────────────────────

export const expand: Variants = {
  collapsed: {
    opacity: 0,
    height: 0,
    transition: { ...transSmooth, opacity: { duration: 0.08 } },
  },
  expanded: {
    opacity: 1,
    height: "auto",
    transition: { ...transSmooth, opacity: { delay: 0.06, duration: 0.14 } },
  },
};

// ── Alert / badge pop-in ──────────────────────────────────────────────────────

export const alertPop: Variants = {
  hidden:  { opacity: 0, scale: 0.92, y: -6 },
  visible: { opacity: 1, scale: 1,    y: 0,  transition: transSpring },
};

// ── Chart bar / area reveal (use with stagger on chart children) ──────────────

export const chartReveal: Variants = {
  hidden:  { opacity: 0, scaleY: 0   },
  visible: { opacity: 1, scaleY: 1,  transition: { ...transSmooth, duration: 0.28 } },
};
