"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface LightBeamBackgroundProps {
  className?: string;
}

export function LightBeamBackground({ className = "" }: LightBeamBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Shader for the light beam effect
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      uniform vec2 uResolution;
      varying vec2 vUv;

      // Noise function for organic movement
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float f = 0.0;
        f += 0.5000 * noise(p); p *= 2.02;
        f += 0.2500 * noise(p); p *= 2.03;
        f += 0.1250 * noise(p); p *= 2.01;
        f += 0.0625 * noise(p);
        return f / 0.9375;
      }

      void main() {
        vec2 uv = vUv;
        vec2 center = vec2(0.5, 0.5);

        // Distance from center vertical line
        float distFromCenter = abs(uv.x - 0.5);

        // Vertical beam
        float beam = smoothstep(0.15, 0.0, distFromCenter);
        beam *= smoothstep(0.0, 0.3, uv.y); // Fade at bottom

        // Add noise to beam
        float n = fbm(vec2(uv.x * 3.0, uv.y * 2.0 - uTime * 0.5));
        beam *= 0.7 + n * 0.6;

        // Glow around beam
        float glow = smoothstep(0.5, 0.0, distFromCenter);
        glow *= smoothstep(0.0, 0.4, uv.y);

        // Radiating lines from bottom center
        vec2 bottomCenter = vec2(0.5, 0.0);
        vec2 toPoint = uv - bottomCenter;
        float angle = atan(toPoint.x, toPoint.y);
        float dist = length(toPoint);

        // Create ray pattern
        float rays = sin(angle * 40.0 + uTime * 2.0) * 0.5 + 0.5;
        rays *= smoothstep(1.5, 0.0, dist);
        rays *= smoothstep(0.0, 0.2, dist);
        rays *= 0.3;

        // Particles moving upward
        float particles = 0.0;
        for(float i = 0.0; i < 8.0; i++) {
          vec2 particlePos = vec2(
            0.5 + sin(i * 1.7 + uTime * 0.5) * 0.15,
            mod(uTime * 0.3 + i * 0.12, 1.0)
          );
          float d = length(uv - particlePos);
          particles += smoothstep(0.03, 0.0, d) * 0.5;
        }

        // Combine effects
        float intensity = beam * 1.5 + glow * 0.4 + rays + particles;

        // Purple/blue color gradient
        vec3 colorCore = vec3(0.9, 0.95, 1.0); // White core
        vec3 colorMid = vec3(0.6, 0.5, 1.0);   // Purple
        vec3 colorOuter = vec3(0.2, 0.1, 0.5); // Dark purple

        vec3 color = mix(colorOuter, colorMid, glow);
        color = mix(color, colorCore, beam * 0.8);

        // Add blue tint to rays
        color += vec3(0.1, 0.15, 0.4) * rays;

        // Final output
        float alpha = intensity * 0.9;
        alpha = clamp(alpha, 0.0, 1.0);

        gl_FragColor = vec4(color * intensity, alpha);
      }
    `;

    // Create fullscreen quad
    const geometry = new THREE.PlaneGeometry(10, 10);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Particle system for extra sparkle
    const particleCount = 200;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 3;
      positions[i * 3 + 1] = Math.random() * 8 - 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
      velocities[i] = Math.random() * 0.02 + 0.01;
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0x8866ff,
      size: 0.03,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Animation
    let time = 0;
    const positionAttr = particleGeometry.attributes.position;
    const animate = () => {
      time += 0.016;
      (material.uniforms.uTime as { value: number }).value = time;

      // Update particles
      if (positionAttr) {
        const pos = positionAttr.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          const vel = velocities[i] ?? 0.01;
          pos[i * 3 + 1] = (pos[i * 3 + 1] ?? 0) + vel;
          if ((pos[i * 3 + 1] ?? 0) > 4) {
            pos[i * 3 + 1] = -4;
            pos[i * 3] = (Math.random() - 0.5) * 3;
          }
          // Attract to center
          pos[i * 3] = (pos[i * 3] ?? 0) * 0.999;
        }
        positionAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
      (material.uniforms.uResolution as { value: THREE.Vector2 }).value.set(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{ background: "linear-gradient(to bottom, #0a0a0a, #000)" }}
    />
  );
}
