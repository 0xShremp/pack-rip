"use client";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

export interface RipParticlesProps {
  count?: number;
  active: boolean;
  cardsFanned?: boolean; // true when cards are fanning out
}

export function RipParticles({
  count = 150,
  active,
  cardsFanned = false,
}: RipParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const [elapsed, setElapsed] = useState(0);
  const velocitiesRef = useRef<number[]>([]);
  const angularVelRef = useRef<number[]>([]);
  const DURATION = 3; // seconds
  const WIND_TIME = useRef(0);

  // Get intensity multiplier based on state
  const getIntensity = () => {
    if (!active) return 0; // calm before rip
    if (cardsFanned) return 0.5; // medium during fan
    return 1; // max during rip
  };

  const intensity = getIntensity();

  // Generate initial particle data once
  const initialData = useMemo(() => {
    const rng = () => Math.random();
    const positions = new Float32Array(count * 3);
    const velocities: number[] = [];
    const angularVel: number[] = [];
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Start near the pack center
      positions[i3] = (rng() - 0.5) * 0.3;
      positions[i3 + 1] = (rng() - 0.5) * 0.3;
      positions[i3 + 2] = -0.5 + (rng() - 0.5) * 0.1;

      // Stronger random velocities
      velocities[i3] = (rng() - 0.5) * 3;
      velocities[i3 + 1] = rng() * 3 + 1;
      velocities[i3 + 2] = (rng() - 0.5) * 3;

      // Angular velocity for spinning
      angularVel[i3] = (rng() - 0.5) * 4;
      angularVel[i3 + 1] = (rng() - 0.5) * 4;
      angularVel[i3 + 2] = (rng() - 0.5) * 4;

      // Colorful particles with variation
      colors[i3] = rng() * 0.6 + 0.4;
      colors[i3 + 1] = rng() * 0.6 + 0.4;
      colors[i3 + 2] = rng() * 0.6 + 0.4;
    }

    velocitiesRef.current = [...velocities];
    angularVelRef.current = [...angularVel];
    return { positions: positions.slice(), colors };
  }, [count]);

  // Reset animation when active changes to true
  useEffect(() => {
    if (active) {
      setElapsed(0);
      WIND_TIME.current = 0;
      // Reset velocities from initial data
      velocitiesRef.current = [];
      angularVelRef.current = [];
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const rng = () => Math.random();
        velocitiesRef.current[i3] = (rng() - 0.5) * 3;
        velocitiesRef.current[i3 + 1] = rng() * 3 + 1;
        velocitiesRef.current[i3 + 2] = (rng() - 0.5) * 3;

        angularVelRef.current[i3] = (rng() - 0.5) * 4;
        angularVelRef.current[i3 + 1] = (rng() - 0.5) * 4;
        angularVelRef.current[i3 + 2] = (rng() - 0.5) * 4;
      }
      if (pointsRef.current) {
        const positions = pointsRef.current.geometry.attributes.position
          .array as Float32Array;
        positions.set(initialData.positions);
        pointsRef.current.geometry.attributes.position.needsUpdate = true;
      }
    }
  }, [active, count, initialData.positions]);

  // Perlin-like noise function for wind
  const noise = (t: number) => {
    return (
      Math.sin(t * 0.5) * 0.5 +
      Math.sin(t * 0.3) * 0.3 +
      Math.sin(t * 0.1) * 0.2
    );
  };

  useFrame((_, delta) => {
    if (!active || !pointsRef.current || elapsed >= DURATION) return;

    setElapsed((e) => Math.min(e + delta, DURATION));
    WIND_TIME.current += delta;

    const positions = pointsRef.current.geometry.attributes.position
      .array as Float32Array;
    const currentIntensity = getIntensity();

    // Wind forces that change over time
    const windX = noise(WIND_TIME.current) * currentIntensity * 2;
    const windY = noise(WIND_TIME.current + 100) * currentIntensity * 1.5;
    const windZ = noise(WIND_TIME.current + 200) * currentIntensity * 2;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Apply wind
      velocitiesRef.current[i3] += windX * delta;
      velocitiesRef.current[i3 + 1] += windY * delta;
      velocitiesRef.current[i3 + 2] += windZ * delta;

      // Apply turbulence (random fluctuations)
      const turbulence = 0.1 * currentIntensity;
      velocitiesRef.current[i3] += (Math.random() - 0.5) * turbulence;
      velocitiesRef.current[i3 + 1] += (Math.random() - 0.5) * turbulence;
      velocitiesRef.current[i3 + 2] += (Math.random() - 0.5) * turbulence;

      // Apply gravity (reduced during calm)
      const gravityForce = 2 * currentIntensity;
      velocitiesRef.current[i3 + 1] -= delta * gravityForce;

      // Damping to prevent particles from getting too fast
      const damping = 0.98;
      velocitiesRef.current[i3] *= damping;
      velocitiesRef.current[i3 + 1] *= damping;
      velocitiesRef.current[i3 + 2] *= damping;

      // Update positions
      positions[i3] += velocitiesRef.current[i3] * delta;
      positions[i3 + 1] += velocitiesRef.current[i3 + 1] * delta;
      positions[i3 + 2] += velocitiesRef.current[i3 + 2] * delta;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  const opacity = active ? Math.max(0, 1 - elapsed / DURATION) : 0;

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(initialData.positions), 3)
    );
    geom.setAttribute(
      "color",
      new THREE.BufferAttribute(initialData.colors, 3)
    );
    return geom;
  }, [initialData.positions, initialData.colors]);

  return (
    <points
      ref={pointsRef}
      visible={active && elapsed < DURATION}
      geometry={geometry}
    >
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export default RipParticles;
