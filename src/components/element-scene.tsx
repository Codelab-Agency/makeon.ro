"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";

const noise = `
float hash(vec3 p) { p=fract(p*.3183099+vec3(.11,.17,.23));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 p) { vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm(vec3 p) { return noise(p)*.55+noise(p*2.03)*.28+noise(p*4.01)*.14; }
`;
const vertexShader = `
uniform float uTime,uMorph,uBurst;
varying vec3 vPosition,vNormal,vView,vBeanPosition;
varying vec2 vUv;
${noise}
void main() {
  vec3 p=position;vUv=uv;
  float n=fbm(p*3.+vec3(0.,-uTime*.9,uTime*.15));
  vBeanPosition=p;
  float seam=exp(-pow(p.x-.10*sin(p.y*3.),2.)*90.)*smoothstep(.0,.55,p.z)*(1.-.5*abs(p.y));
  vec3 bean=vec3(p.x*.94,p.y*1.24,p.z*.65-seam*.23);
  bean+=normal*(fbm(p*17.)-.45)*.035;
  float tilt=-.38;
  bean.xy=mat2(cos(tilt),-sin(tilt),sin(tilt),cos(tilt))*bean.xy;
  vec3 water=p;
  water.xz*=.89*(1.-p.y*.42);
  water.y=p.y*1.35+.07;
  water+=normal*sin(p.y*7.+uTime*1.8+p.x*3.)*.045;
  water+=normal*(n-.4)*.09;
  p=mix(bean,water,uMorph);
  p+=normal*sin(p.y*9.+uTime*3.)*uBurst*.16;
  vPosition=p;
  vec4 view=modelViewMatrix*vec4(p,1.);
  vNormal=normalize(normalMatrix*normal);vView=normalize(-view.xyz);
  gl_Position=projectionMatrix*view;
}`;
const fragmentShader = `
uniform float uTime,uMorph;
varying vec3 vPosition,vNormal,vView,vBeanPosition;
varying vec2 vUv;
${noise}
void main() {
 float fresnel=pow(1.-abs(dot(normalize(vNormal),vView)),2.5);
 float turbulence=fbm(vPosition*4.2+vec3(0.,-uTime*1.3,0.));
 float grain=fbm(vBeanPosition*25.);
 float seam=exp(-pow(vBeanPosition.x-.10*sin(vBeanPosition.y*3.),2.)*160.)*smoothstep(.0,.55,vBeanPosition.z);
 float diffuse=.35+.65*max(dot(normalize(vNormal),normalize(vec3(-.6,.8,1.))),0.);
 vec3 bean=mix(vec3(.13,.055,.021),vec3(.48,.245,.10),grain)*diffuse;
 bean=mix(bean,vec3(.055,.018,.007),seam*.94);
 bean+=vec3(.58,.30,.12)*fresnel*.48;
 float beanHighlight=pow(max(dot(reflect(-normalize(vec3(-2.,3.,4.)),normalize(vNormal)),vView),0.),18.);
 bean+=vec3(.67,.38,.18)*beanHighlight*.35;
 float ripple=sin(vPosition.y*12.+turbulence*5.+uTime)*.5+.5;
 vec3 water=mix(vec3(.012,.12,.20),vec3(.055,.58,.78),turbulence*.7+ripple*.2);
 water=mix(water,vec3(.53,.94,1.),fresnel*.95);
 float light=pow(max(dot(reflect(-normalize(vec3(-2.,3.,4.)),normalize(vNormal)),vView),0.),30.);
 water+=vec3(.83,.97,1.)*light*.9;
 water+=vec3(.1,.38,.5)*pow(ripple,16.)*.5;
 gl_FragColor=vec4(mix(bean,water,uMorph),1.);
}`;

const particleVertex = `
uniform float uTime,uMorph,uBurst,uPixelRatio;
attribute vec3 aSeed;
varying float vAlpha;
void main(){
 float cycle=fract(aSeed.y+uTime*(.085+aSeed.z*.045));
 float angle=aSeed.x*6.283+uTime*.25;
 float radius=(.25+aSeed.z*1.3)*(1.-cycle*.45);
 vec3 aroma=vec3(cos(angle)*radius*.8,cycle*4.2-1.7,sin(angle)*radius*.6);
 aroma.x+=sin(cycle*6.+uTime*.6)*cycle*.35;
 vec3 water=vec3(cos(angle)*(1.25+aSeed.z*.95),sin(angle*2.+uTime*.4)*.7+(aSeed.y-.5)*2.,sin(angle)*(1.25+aSeed.z*.95));
 vec3 p=mix(aroma,water,uMorph);
 p*=1.+uBurst*.75;
 vec4 view=modelViewMatrix*vec4(p,1.);
 gl_Position=projectionMatrix*view;
 gl_PointSize=(2.+aSeed.z*4.)*uPixelRatio*(4./-view.z);
 vAlpha=mix(sin(cycle*3.14159)*.8,.4+aSeed.z*.4,uMorph);
}`;
const particleFragment = `
uniform float uMorph;
varying float vAlpha;
void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float glow=pow(1.-d*2.,2.);gl_FragColor=vec4(mix(vec3(.75,.47,.25),vec3(.25,.8,1.),uMorph),glow*vAlpha);}
`;

export default function ElementScene({
  world,
  transitionId,
}: {
  world: "coffee" | "water";
  transitionId: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const controls = useRef<{
    morph: { value: number };
    burst: { value: number };
    render: () => void;
  } | null>(null);
  const currentWorld = useRef(world);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-hidden", "true");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 30);
    camera.position.set(0, 0.25, 7.2);
    const group = new THREE.Group();
    scene.add(group);
    const morph = { value: currentWorld.current === "water" ? 1 : 0 },
      time = { value: 0 },
      burst = { value: 0 };
    const uniforms = { uTime: time, uMorph: morph, uBurst: burst };
    const geometry = new THREE.SphereGeometry(1, 96, 72);
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    });
    const core = new THREE.Mesh(geometry, material);
    group.add(core);
    const satellite = new THREE.Mesh(geometry, material);
    satellite.scale.setScalar(0.24);
    satellite.position.set(1.45, -0.38, 0.15);
    group.add(satellite);
    const satellite2 = new THREE.Mesh(geometry, material);
    satellite2.scale.setScalar(0.18);
    satellite2.position.set(-1.3, 0.7, -0.4);
    group.add(satellite2);
    const count = window.innerWidth < 650 ? 380 : 850;
    const positions = new Float32Array(count * 3),
      seeds = new Float32Array(count * 3);
    let seed = 27;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < count * 3; i++) seeds[i] = random();
    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    particlesGeo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 3));
    const particlesMat = new THREE.ShaderMaterial({
      uniforms: {
        ...uniforms,
        uPixelRatio: { value: renderer.getPixelRatio() },
      },
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    particles.frustumCulled = false;
    group.add(particles);
    const rings: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>[] =
      [];
    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.1 + i * 0.35, 0.006, 8, 150),
        new THREE.MeshBasicMaterial({
          color: 0xd17c37,
          transparent: true,
          opacity: 0.25 - i * 0.04,
        }),
      );
      ring.rotation.x = Math.PI / 2.2;
      ring.position.y = -1.65 - i * 0.04;
      scene.add(ring);
      rings.push(ring);
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = true,
      frame = 0;
    const pointer = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width - 0.5) * 0.35;
      pointer.y = ((e.clientY - r.top) / r.height - 0.5) * 0.2;
    };
    el.addEventListener("pointermove", onPointer);
    const render = () => {
      const m = morph.value;
      satellite.position.y = -0.38 + Math.sin(time.value * 0.65) * 0.25;
      satellite.rotation.z = time.value * 0.1;
      satellite2.position.y = 0.7 + Math.cos(time.value * 0.55) * 0.2;
      satellite2.rotation.z = -time.value * 0.12;
      group.rotation.y += (pointer.x - group.rotation.y) * 0.025;
      group.rotation.x += (pointer.y - group.rotation.x) * 0.025;
      core.rotation.y = Math.sin(time.value * 0.3) * 0.25;
      core.position.y = reduced.matches ? 0 : Math.sin(time.value * 0.8) * 0.06;
      rings.forEach((ring, i) => {
        ring.material.color.setRGB(
          1 - m * 0.75,
          0.35 + m * 0.35,
          0.08 + m * 0.82,
        );
        ring.scale.setScalar(
          1 + Math.sin(time.value * 1.4 - i) * (0.018 + m * 0.045),
        );
      });
      renderer.render(scene, camera);
      el.dataset.morph = m.toFixed(3);
      el.dataset.frame = String(++frame);
    };
    controls.current = { morph, burst, render };
    const resize = () => {
      const w = el.clientWidth,
        h = el.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      render();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(el);
    resize();
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { rootMargin: "60px" },
    );
    observer.observe(el);
    let last = performance.now();
    // Skip continuous rendering offscreen, in hidden tabs and for reduced motion.
    // Explicit renders still update the static scene after resizing/world changes.
    renderer.setAnimationLoop(() => {
      const now = performance.now(),
        dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible || document.hidden || reduced.matches) return;
      time.value += dt;
      render();
    });
    const onMotion = () => render();
    reduced.addEventListener("change", onMotion);
    return () => {
      controls.current = null;
      renderer.setAnimationLoop(null);
      observer.disconnect();
      resizeObserver.disconnect();
      reduced.removeEventListener("change", onMotion);
      el.removeEventListener("pointermove", onPointer);
      gsap.killTweensOf(morph);
      gsap.killTweensOf(burst);
      // React can remount this scene: release GPU resources, not just the canvas.
      geometry.dispose();
      material.dispose();
      particlesGeo.dispose();
      particlesMat.dispose();
      rings.forEach((r) => {
        r.geometry.dispose();
        r.material.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  useEffect(() => {
    currentWorld.current = world;
    const c = controls.current;
    if (!c) return;
    gsap.killTweensOf(c.morph);
    gsap.killTweensOf(c.burst);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      c.morph.value = world === "water" ? 1 : 0;
      c.burst.value = 0;
      c.render();
      return;
    }
    gsap.to(c.morph, {
      value: world === "water" ? 1 : 0,
      duration: 1.8,
      ease: "power2.inOut",
      onUpdate: c.render,
    });
    gsap.fromTo(
      c.burst,
      { value: 0 },
      {
        value: 1,
        duration: 0.7,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut",
        onUpdate: c.render,
      },
    );
  }, [world, transitionId]);

  return (
    <div
      className={`element-scene ${failed ? "scene-fallback" : ""}`}
      ref={host}
      role="img"
      aria-label={
        world === "coffee"
          ? "Bob de cafea 3D animat, cu particule de aromă"
          : "Picătură 3D animată, puritatea apei"
      }
      data-engine={failed ? "css" : "three"}
    >
      <div className="element-fallback" />
      <span className="scene-glow" />
    </div>
  );
}
