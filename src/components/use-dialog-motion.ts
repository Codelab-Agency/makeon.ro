"use client";

import { useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";

export default function useDialogMotion(
  ref: RefObject<HTMLDialogElement | null>,
  opened: boolean,
  kind: "menu" | "cart",
) {
  const previousOverflow = useRef<string | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const restore = () => {
      if (previousOverflow.current !== null) {
        document.body.style.overflow = previousOverflow.current;
        previousOverflow.current = null;
      }
    };
    const timeline = gsap.timeline();
    const keyboardFocus = () => { el.dataset.keyboardFocus = "true"; };
    const pointerFocus = () => { el.dataset.keyboardFocus = "false"; };
    if (opened) {
      if (!el.open) {
        previousOverflow.current = document.body.style.overflow;
        // Native dialogs mark autofocus as focus-visible even after a tap.
        el.dataset.keyboardFocus = String(document.activeElement?.matches(":focus-visible") ?? false);
        el.showModal();
      }
      el.addEventListener("keydown", keyboardFocus);
      el.addEventListener("pointerdown", pointerFocus);
      document.body.style.overflow = "hidden";
      if (kind === "menu") {
        timeline
          .fromTo(
            el,
            { yPercent: -100 },
            { yPercent: 0, duration: reduced ? 0 : 0.55, ease: "power3.inOut" },
          )
          .fromTo(
            el.querySelectorAll(".mobile-menu-link"),
            { y: 28, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: reduced ? 0 : 0.5,
              stagger: reduced ? 0 : 0.06,
              ease: "power3.out",
            },
            reduced ? 0 : 0.2,
          )
          .fromTo(
            el.querySelector(".mobile-menu-bottom"),
            { y: 10, opacity: 0 },
            { y: 0, opacity: 1, duration: reduced ? 0 : 0.35 },
            reduced ? 0 : 0.5,
          );
      } else {
        timeline.fromTo(
          el,
          { xPercent: 100, "--overlay-opacity": 0 },
          {
            xPercent: 0,
            "--overlay-opacity": 0.48,
            duration: reduced ? 0 : 0.48,
            ease: "power3.out",
          },
        );
      }
    } else if (el.open) {
      timeline.to(
        el,
        kind === "menu"
          ? {
              yPercent: -100,
              duration: reduced ? 0 : 0.35,
              ease: "power3.inOut",
              onComplete: () => {
                el.close();
                restore();
              },
            }
          : {
              xPercent: 100,
              "--overlay-opacity": 0,
              duration: reduced ? 0 : 0.32,
              ease: "power3.in",
              onComplete: () => {
                el.close();
                restore();
              },
            },
      );
    }
    return () => {
      timeline.kill();
      el.removeEventListener("keydown", keyboardFocus);
      el.removeEventListener("pointerdown", pointerFocus);
    };
  }, [opened, kind, ref]);
  useEffect(
    () => () => {
      ref.current?.close();
      if (previousOverflow.current !== null) {
        document.body.style.overflow = previousOverflow.current;
        previousOverflow.current = null;
      }
    },
    [ref],
  );
}
