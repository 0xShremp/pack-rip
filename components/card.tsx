"use client";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

export interface CardProps {
  frontImage: string;
  backImage: string;
  position: [number, number, number];
  rotation?: [number, number, number];
}

export function Card({
  frontImage,
  backImage,
  position,
  rotation = [0, 0, 0],
}: CardProps) {
  // Load textures
  const [frontTexture, backTexture] = useTexture([frontImage, backImage]);
  // Card dimensions (trading card aspect ratio - 2.5" x 3.5")
  const cardWidth = 0.7;
  const cardHeight = 1.0;

  return (
    <group position={position} rotation={rotation}>
      {/* Card front */}
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[cardWidth, cardHeight]} />
        <meshStandardMaterial map={frontTexture} side={THREE.FrontSide} />
      </mesh>

      {/* Card back */}
      <mesh position={[0, 0, -0.001]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[cardWidth, cardHeight]} />
        <meshStandardMaterial map={backTexture} side={THREE.FrontSide} />
      </mesh>

      {/* Card edges for thickness */}
      <mesh position={[0, cardHeight / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[cardWidth, 0.002]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, -cardHeight / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[cardWidth, 0.002]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[cardWidth / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.002, cardHeight]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-cardWidth / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.002, cardHeight]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}
