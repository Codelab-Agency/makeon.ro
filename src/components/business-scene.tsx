"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function BusinessScene({
  world,
}: {
  world: "coffee" | "water";
}) {
  const host = useRef<HTMLDivElement>(null),
    current = useRef(world);
  const controls = useRef<{
    coffee: THREE.Group;
    water: THREE.Group;
    render: () => void;
  } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0, 0);
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(35, 1, 0.1, 40);
    camera.position.set(0, 1.5, 4.2);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xffefd7, 0x38342a, 3));
    const key = new THREE.DirectionalLight(0xffffff, 4);
    key.position.set(3, 5, 4);
    scene.add(key);
    const rim = new THREE.PointLight(0x99dce8, 12);
    rim.position.set(-3, 2, 1);
    scene.add(rim);
    const coffee = new THREE.Group(),
      water = new THREE.Group();
    scene.add(coffee, water);
    const porcelain = new THREE.MeshStandardMaterial({
      color: 0xe9eadb,
      roughness: 0.25,
      metalness: 0.08,
      side: THREE.DoubleSide,
    });
    const cupPoints = [
      new THREE.Vector2(0.25, -0.45),
      new THREE.Vector2(0.43, -0.4),
      new THREE.Vector2(0.58, 0.42),
      new THREE.Vector2(0.56, 0.48),
      new THREE.Vector2(0.5, 0.45),
      new THREE.Vector2(0.37, -0.33),
      new THREE.Vector2(0.25, -0.35),
    ];
    const cup = new THREE.Mesh(
      new THREE.LatheGeometry(cupPoints, 64),
      porcelain,
    );
    coffee.add(cup);
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.065, 12, 40),
      porcelain,
    );
    handle.position.set(0.61, 0.02, 0);
    handle.rotation.y = Math.PI / 2;
    coffee.add(handle);
    const saucer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.78, 0.065, 64),
      porcelain,
    );
    saucer.position.y = -0.49;
    coffee.add(saucer);
    const surface = new THREE.Mesh(
      new THREE.CircleGeometry(0.48, 64),
      new THREE.MeshStandardMaterial({ color: 0x7c431e, roughness: 0.4 }),
    );
    surface.rotation.x = -Math.PI / 2;
    surface.position.y = 0.38;
    coffee.add(surface);
    const crema = new THREE.Mesh(
      new THREE.TorusGeometry(0.27, 0.035, 8, 48),
      new THREE.MeshStandardMaterial({ color: 0xd7b67d, roughness: 0.6 }),
    );
    crema.rotation.x = -Math.PI / 2;
    crema.position.y = 0.39;
    coffee.add(crema);
    const steam: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 0.18;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x, 0.58, 0),
        new THREE.Vector3(x - 0.07, 0.8, 0),
        new THREE.Vector3(x + 0.06, 1.05, 0),
        new THREE.Vector3(x, 1.25, 0),
      ]);
      const vapor = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 24, 0.008, 6, false),
        new THREE.MeshBasicMaterial({
          color: 0xf1ddbc,
          transparent: true,
          opacity: 0.2,
        }),
      );
      coffee.add(vapor);
      steam.push(vapor);
    }
    const beans: THREE.Mesh[] = [];
    const beanMaterial = new THREE.MeshStandardMaterial({
      color: 0x8d522e,
      roughness: 0.65,
    });
    for (let i = 0; i < 7; i++) {
      const bean = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 16, 12),
        beanMaterial,
      );
      bean.scale.set(0.7, 1.15, 0.6);
      coffee.add(bean);
      beans.push(bean);
    }
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xc9f3f4,
      roughness: 0.08,
      metalness: 0.12,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.4, 1.4, 64, 1, true),
      glassMaterial,
    );
    water.add(glass);
    const glassRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.014, 8, 64),
      new THREE.MeshStandardMaterial({
        color: 0xe0ffff,
        transparent: true,
        opacity: 0.75,
      }),
    );
    glassRim.rotation.x = Math.PI / 2;
    glassRim.position.y = 0.7;
    water.add(glassRim);
    const liquid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.47, 0.39, 0.92, 48),
      new THREE.MeshPhysicalMaterial({
        color: 0x63c8d2,
        roughness: 0.12,
        metalness: 0.1,
        transparent: true,
        opacity: 0.65,
      }),
    );
    liquid.position.y = -0.21;
    water.add(liquid);
    const drops: THREE.Mesh[] = [];
    const dropMaterial = new THREE.MeshStandardMaterial({
      color: 0x9fe8ec,
      roughness: 0.12,
      metalness: 0.25,
    });
    for (let i = 0; i < 7; i++) {
      const drop = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 12, 12),
        dropMaterial,
      );
      water.add(drop);
      drops.push(drop);
    }
    const rings: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.1 + i * 0.3, 0.006, 6, 80),
        new THREE.MeshBasicMaterial({
          color: 0xd9bd8a,
          transparent: true,
          opacity: 0.2,
        }),
      );
      ring.rotation.x = Math.PI / 2.5;
      ring.position.y = -0.62;
      scene.add(ring);
      rings.push(ring);
    }
    coffee.scale.setScalar(current.current === "coffee" ? 1 : 0.001);
    water.scale.setScalar(current.current === "water" ? 1 : 0.001);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let time = 0,
      visible = false;
    const pointer = { x: 0 },
      scroll = { value: reduced.matches ? 1 : 0 };
    const render = () => {
      const p = scroll.value;
      coffee.position.y = Math.sin(time * 0.9) * 0.045;
      water.position.y = Math.sin(time * 0.9) * 0.06;
      coffee.rotation.y =
        0.3 + Math.sin(time * 0.35) * 0.15 + pointer.x + p * 0.08;
      water.rotation.y = pointer.x + p * 0.06;
      beans.forEach((bean, i) => {
        const a = time * 0.35 + (i * Math.PI * 2) / 7 + p * 0.12,
          r = 1.2 - p * 0.06;
        bean.position.set(
          Math.cos(a) * r,
          0.15 + Math.sin(a * 1.7) * 0.3,
          Math.sin(a) * 0.65,
        );
        bean.rotation.set(a, a * 0.5, 0.5);
      });
      drops.forEach((drop, i) => {
        const a = time * 0.3 + (i * Math.PI * 2) / 7;
        drop.position.set(
          Math.cos(a) * (1.1 - p * 0.04),
          0.15 + Math.sin(a * 2) * 0.55,
          Math.sin(a) * 0.6,
        );
      });
      steam.forEach((vapor, i) => {
        vapor.position.y = Math.sin(time * 0.8 + i) * 0.06;
        vapor.scale.y = 0.9 + p * 0.1;
        (vapor.material as THREE.MeshBasicMaterial).opacity =
          (0.16 + Math.sin(time + i) * 0.06) * (0.9 + p * 0.1);
      });
      const fill = 0.92 + p * 0.08;
      liquid.scale.y = fill;
      liquid.position.y = -0.67 + 0.46 * fill;
      rings.forEach((ring, i) => {
        ring.scale.setScalar(0.97 + p * 0.06 + Math.sin(time - i) * 0.04);
        (ring.material as THREE.MeshBasicMaterial).color.set(
          current.current === "coffee" ? 0xd9bd8a : 0x80d6df,
        );
      });
      renderer.render(scene, camera);
      el.dataset.frame = String(time);
      el.dataset.scrollProgress = p.toFixed(3);
      el.dataset.fill = fill.toFixed(3);
    };
    controls.current = { coffee, water, render };
    const resize = () => {
      if (!el.clientWidth || !el.clientHeight) return;
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight, false);
      render();
    };
    const sizes = new ResizeObserver(resize);
    sizes.observe(el);
    resize();
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(el);
    const move = (event: PointerEvent) => {
      pointer.x =
        ((event.clientX - el.getBoundingClientRect().left) / el.clientWidth -
          0.5) *
        0.3;
      if (reduced.matches) render();
    };
    el.addEventListener("pointermove", move);
    const motion = () => render();
    reduced.addEventListener("change", motion);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const trigger = el.closest("#abonamente") ?? el;
      const tween = gsap.fromTo(
        scroll,
        { value: 0 },
        {
          value: 1,
          ease: "none",
          onUpdate: render,
          scrollTrigger: {
            trigger,
            start: "top 90%",
            end: "bottom 35%",
            scrub: 1.2,
          },
        },
      );
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        scroll.value = 1;
        render();
      };
    });
    let last = performance.now();
    renderer.setAnimationLoop(() => {
      const now = performance.now(),
        dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!visible || document.hidden || reduced.matches) return;
      time += dt;
      render();
    });
    return () => {
      mm.revert();
      controls.current = null;
      gsap.killTweensOf(coffee.scale);
      gsap.killTweensOf(water.scale);
      renderer.setAnimationLoop(null);
      sizes.disconnect();
      observer.disconnect();
      el.removeEventListener("pointermove", move);
      reduced.removeEventListener("change", motion);
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry);
          (Array.isArray(object.material)
            ? object.material
            : [object.material]
          ).forEach((material) => materials.add(material));
        }
      });
      // Dispose every owned GPU resource to avoid leaks on remount/navigation.
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  useEffect(() => {
    current.current = world;
    const c = controls.current;
    if (!c) return;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? 0
      : 0.85;
    gsap.to(c.coffee.scale, {
      x: world === "coffee" ? 1 : 0.001,
      y: world === "coffee" ? 1 : 0.001,
      z: world === "coffee" ? 1 : 0.001,
      duration,
      overwrite: true,
      ease: "power2.inOut",
      onUpdate: c.render,
    });
    gsap.to(c.water.scale, {
      x: world === "water" ? 1 : 0.001,
      y: world === "water" ? 1 : 0.001,
      z: world === "water" ? 1 : 0.001,
      duration,
      overwrite: true,
      ease: "power2.inOut",
      onUpdate: c.render,
    });
  }, [world]);
  return (
    <div
      ref={host}
      className={`business-scene ${failed ? "business-scene-fallback" : ""}`}
      role="img"
      aria-label={
        world === "coffee"
          ? "Ceașcă de cafea 3D cu boabe animate"
          : "Pahar de apă 3D cu picături animate"
      }
      data-world={world}
      data-engine={failed ? "css" : "three"}
    >
      <span className="business-scene-glow" />
      {failed && (
        <span className="business-scene-symbol">
          {world === "coffee" ? "☕" : "◉"}
        </span>
      )}
      <span className="business-scene-caption">
        {world === "coffee"
          ? "RITUALUL ECHIPEI TALE"
          : "ECHILIBRU ÎN FIECARE ZI"}
      </span>
    </div>
  );
}
