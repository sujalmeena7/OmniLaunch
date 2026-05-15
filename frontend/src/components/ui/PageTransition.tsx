"use client";

/* ============================================================
   OmniLaunch — Page Transition Components
   Provides animated wrappers for route transitions, modal/overlay
   open/close, list item add/remove, and skeleton-to-content fade-in.
   ============================================================ */

import { type ReactNode } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { usePathname } from "next/navigation";

/* ----------------------------------------------------------
   1. Page Transition Wrapper
   Wraps dashboard page content with fade + translateY(8px)
   over 200ms ease-out, keyed by pathname for route changes.
   ---------------------------------------------------------- */

const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};

const pageTransition = {
  duration: 0.2,
  ease: "easeOut" as const,
};

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/* ----------------------------------------------------------
   2. Modal / Overlay Transition
   Scale-up + fade-in on open, scale-down + fade-out on close.
   ---------------------------------------------------------- */

const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

const modalTransition = {
  duration: 0.2,
  ease: "easeOut" as const,
};

interface ModalTransitionProps {
  children: ReactNode;
  isOpen: boolean;
  /** Unique key for AnimatePresence tracking */
  id?: string;
}

export function ModalTransition({ children, isOpen, id = "modal" }: ModalTransitionProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key={id}
          variants={modalVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={modalTransition}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ----------------------------------------------------------
   3. List Item Transition
   Height + opacity animation for add/remove of list items.
   ---------------------------------------------------------- */

const listItemVariants: Variants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
};

const listItemTransition = {
  duration: 0.2,
  ease: "easeOut" as const,
};

interface ListItemTransitionProps {
  children: ReactNode;
  /** Unique key for each list item — pass via the parent's map key */
  layoutId?: string;
}

export function ListItemTransition({ children, layoutId }: ListItemTransitionProps) {
  return (
    <motion.div
      layout
      layoutId={layoutId}
      variants={listItemVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={listItemTransition}
      style={{ overflow: "hidden" }}
    >
      {children}
    </motion.div>
  );
}

/* ----------------------------------------------------------
   4. Skeleton-to-Content Fade-In
   Fades in content once loading completes (150–300ms).
   ---------------------------------------------------------- */

const fadeInVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

const fadeInTransition = {
  duration: 0.25, // 250ms — midpoint of 150–300ms range
  ease: "easeOut" as const,
};

interface SkeletonFadeInProps {
  children: ReactNode;
  /** Controls whether skeleton or content is shown */
  isLoaded: boolean;
  /** Skeleton placeholder to show while loading */
  skeleton: ReactNode;
}

export function SkeletonFadeIn({ children, isLoaded, skeleton }: SkeletonFadeInProps) {
  return (
    <AnimatePresence mode="wait">
      {isLoaded ? (
        <motion.div
          key="content"
          variants={fadeInVariants}
          initial="initial"
          animate="animate"
          transition={fadeInTransition}
        >
          {children}
        </motion.div>
      ) : (
        <motion.div
          key="skeleton"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {skeleton}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
