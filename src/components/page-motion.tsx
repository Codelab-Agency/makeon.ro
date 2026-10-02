"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
export default function PageMotion({ world }: { world: "coffee" | "water" }) {
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const cleanups: (() => void)[] = [];
      const pauseDecoration = () =>
        document.documentElement.classList.toggle(
          "cinematic-paused",
          document.hidden,
        );
      pauseDecoration();
      document.addEventListener("visibilitychange", pauseDecoration);
      cleanups.push(() => {
        document.removeEventListener("visibilitychange", pauseDecoration);
        document.documentElement.classList.remove("cinematic-paused");
      });
      const ctx = gsap.context(() => {
        gsap.utils
          .toArray<HTMLElement>(
            ".brand-card, .product-art, .membership-card, .ecosystem, .business, .closing",
          )
          .forEach((el) => {
            const loop = gsap.timeline({
              paused: true,
              repeat: -1,
              yoyo: true,
            });
            const objects = el.matches(".brand-card, .product-art")
              ? el.querySelectorAll(
                  ".bag, .filter-cylinder, .subscription-pass, .water-glass",
                )
              : [];
            if (objects.length)
              loop.to(objects, {
                y: -12,
                rotation: 2,
                duration: 3.2,
                stagger: 0.3,
                ease: "sine.inOut",
              });
            const observer = new IntersectionObserver(([entry]) => {
              el.classList.toggle("motion-visible", entry.isIntersecting);
              if (entry.isIntersecting && !document.hidden) loop.play();
              else loop.pause();
            });
            observer.observe(el);
            const visibility = () => {
              if (document.hidden) loop.pause();
              else if (el.classList.contains("motion-visible")) loop.play();
            };
            document.addEventListener("visibilitychange", visibility);
            cleanups.push(() => {
              observer.disconnect();
              el.classList.remove("motion-visible");
              document.removeEventListener("visibilitychange", visibility);
            });
          });
        gsap.utils.toArray<HTMLElement>(".ambient-orbit").forEach((orbit) => {
          gsap.fromTo(
            orbit,
            { y: -6, rotation: -2 },
            {
              y: 6,
              rotation: 2,
              ease: "none",
              scrollTrigger: {
                trigger: orbit.closest(".brand-card, .product-card, section"),
                start: "top bottom",
                end: "bottom top",
                scrub: 0.8,
              },
            },
          );
        });
        gsap.fromTo(
          ".journey-progress",
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: ".steps",
              start: "top 85%",
              end: "bottom 55%",
              scrub: 0.7,
            },
          },
        );
        gsap.utils
          .toArray<HTMLElement>(".product-grid .product-art")
          .forEach((art, i) => {
            gsap.fromTo(
              art,
              { y: world === "coffee" ? 6 : 9 },
              {
                y: world === "coffee" ? -6 : -9,
                ease: "none",
                scrollTrigger: {
                  trigger: art.closest(".product-card"),
                  start: "top bottom",
                  end: "bottom top",
                  scrub: 1.2 + i * 0.15,
                },
              },
            );
          });
        gsap.to(".closing-star", {
          rotation: 3,
          ease: "none",
          scrollTrigger: {
            trigger: ".closing",
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
        ScrollTrigger.refresh();
      });
      return () => {
        cleanups.forEach((cleanup) => cleanup());
        ctx.revert();
      };
    });
    return () => mm.revert();
  }, [world]);
  return null;
}
