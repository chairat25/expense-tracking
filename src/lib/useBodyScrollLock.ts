"use client";

import { useEffect } from "react";

interface SavedBodyStyles {
  htmlOverflow: string;
  htmlOverscroll: string;
  bodyOverflow: string;
  bodyOverscroll: string;
  bodyPosition: string;
  bodyTop: string;
  bodyLeft: string;
  bodyRight: string;
  bodyWidth: string;
  scrollY: number;
}

let activeLockCount = 0;
let savedStyles: SavedBodyStyles | null = null;

function applyScrollLock() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const html = document.documentElement;
  const body = document.body;
  if (!html || !body) return;

  const scrollY = window.scrollY || window.pageYOffset || 0;
  savedStyles = {
    htmlOverflow: html.style.overflow,
    htmlOverscroll: html.style.overscrollBehavior,
    bodyOverflow: body.style.overflow,
    bodyOverscroll: body.style.overscrollBehavior,
    bodyPosition: body.style.position,
    bodyTop: body.style.top,
    bodyLeft: body.style.left,
    bodyRight: body.style.right,
    bodyWidth: body.style.width,
    scrollY,
  };

  html.style.overflow = "hidden";
  html.style.overscrollBehavior = "none";
  body.style.overflow = "hidden";
  body.style.overscrollBehavior = "none";
  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
}

function releaseScrollLock() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const html = document.documentElement;
  const body = document.body;
  if (!html || !body || !savedStyles) return;

  const {
    htmlOverflow,
    htmlOverscroll,
    bodyOverflow,
    bodyOverscroll,
    bodyPosition,
    bodyTop,
    bodyLeft,
    bodyRight,
    bodyWidth,
    scrollY,
  } = savedStyles;
  savedStyles = null;

  html.style.overflow = htmlOverflow;
  html.style.overscrollBehavior = htmlOverscroll;
  body.style.overflow = bodyOverflow;
  body.style.overscrollBehavior = bodyOverscroll;
  body.style.position = bodyPosition;
  body.style.top = bodyTop;
  body.style.left = bodyLeft;
  body.style.right = bodyRight;
  body.style.width = bodyWidth;

  window.scrollTo(0, scrollY);
}

/**
 * Locks background page scroll (including iOS Safari / PWA rubber-band touch scrolling)
 * while any modal or popover is open. Ref-counted so nested overlays restore cleanly.
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    activeLockCount += 1;
    if (activeLockCount === 1) {
      applyScrollLock();
    }

    return () => {
      activeLockCount = Math.max(0, activeLockCount - 1);
      if (activeLockCount === 0) {
        releaseScrollLock();
      }
    };
  }, [locked]);
}
