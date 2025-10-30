"use client";
import { Card } from "@/models/card/card";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef, useState } from "react";

export interface FanCard {
  frontImage: string;
  backImage: string;
}

export interface CardsFanProps {
  cards: FanCard[];
  isVisible: boolean; // whether to render during loading/intro
  isActive: boolean; // whether the fan animation is active
}

// Calculate position and rotation for a card in the fan
function getCardFanPositions(index: number, total: number) {
  const fanAngle = 45; // degrees total spread
  const fanRadius = 0.5; // distance from pivot to card center
  const offset = (index - (total - 1) / 2) / (total > 1 ? total - 1 : 1);

  const angleRad = offset * ((fanAngle * Math.PI) / 180);
  const x = Math.sin(angleRad) * fanRadius;
  const y = (Math.cos(angleRad) - 1) * fanRadius;
  const z = -index * 0.01;

  return {
    position: [x, y, z] as [number, number, number],
    rotation: [0, 0, angleRad] as [number, number, number],
  };
}

export function CardsFan({ cards, isVisible, isActive }: CardsFanProps) {
  const [elapsed, setElapsed] = useState(0);
  const FAN_DURATION = 1.0;
  const FAN_STAGGER = 0.25;

  const shouldResetRef = useRef(false);
  const shouldResetOpacityRef = useRef(false);

  useLayoutEffect(() => {
    if (isActive) {
      shouldResetRef.current = true;
    } else {
      shouldResetOpacityRef.current = true;
    }
  }, [isActive]);

  useFrame(({ camera }, delta) => {
    if (shouldResetOpacityRef.current) {
      shouldResetOpacityRef.current = false;
    }

    if (!isActive) return;
    if (shouldResetRef.current) {
      setElapsed(0);
      shouldResetRef.current = false;
    } else {
      setElapsed((e) => e + delta);
    }

    // Animate camera zoom in during the fan animation
    const totalAnimationTime = FAN_STAGGER * cards.length + FAN_DURATION;
    const cameraProgress = Math.min(1, elapsed / totalAnimationTime);
    const easedCameraProgress = 1 - Math.pow(1 - cameraProgress, 3); // same easing as cards
    const startZ = 4;
    const endZ = 3.75;
    camera.position.z = startZ + (endZ - startZ) * easedCameraProgress;
    camera.updateProjectionMatrix();
  });

  return (
    <group visible={isVisible}>
      {cards.map((card, index) => {
        const stackedPosition: [number, number, number] = [
          0,
          0,
          -index * 0.001,
        ];

        const { position: targetPos, rotation: targetRot } =
          getCardFanPositions(index, cards.length);

        const start = 0;
        // const start = index * FAN_STAGGER;
        const raw = Math.max(0, Math.min(1, (elapsed - start) / FAN_DURATION));
        const eased = 1 - Math.pow(1 - raw, 3); // ease-out cubic

        const pos: [number, number, number] = [
          stackedPosition[0] + (targetPos[0] - stackedPosition[0]) * eased,
          stackedPosition[1] + (targetPos[1] - stackedPosition[1]) * eased,
          stackedPosition[2] + (targetPos[2] - stackedPosition[2]) * eased,
        ];

        const rot: [number, number, number] = [
          -Math.PI / 2,
          -Math.PI / 2 + (targetRot[2] as number) * eased,
          -Math.PI / 2,
        ];

        return (
          <group key={index}>
            <Card
              frontImage={card.frontImage}
              backImage={card.backImage}
              position={pos}
              rotation={rot}
            />
          </group>
        );
      })}
    </group>
  );
}
