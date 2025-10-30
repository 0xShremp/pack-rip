"use client";
import { CardsFan } from "@/components/cards-fan";
import { RipParticles } from "@/components/rip-particles";
import { Pack } from "@/models/pack/pack";
import {
  Cloud,
  Clouds,
  Environment,
  OrbitControls,
  Preload,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import clsx from "clsx";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { Swarm } from "./particles";

export interface CardData {
  frontImage: string;
  backImage: string;
}

export interface PackRipProps {
  packTexture?: string;
  cards?: CardData[];
}

const PackRip = ({ packTexture, cards = [] }: PackRipProps) => {
  const [state, setState] = useState<
    "loading" | "intro" | "ready" | "rip" | "ripping" | "outro" | "cards"
  >("loading");
  const [isLoaded, setIsLoaded] = useState(false);

  // Calculate total images to load
  const totalImagesToLoad = (packTexture ? 1 : 0) + cards.length * 2;

  // Start intro animation after loading - using a callback approach to avoid cascading renders
  const handleLoadComplete = () => {
    // console.log("handleLoadComplete called");
    setIsLoaded(true);
    // Use setTimeout to break out of the render cycle
    setTimeout(() => setState("intro"), 0);
  };

  // Preload images using the Image API
  useEffect(() => {
    if (totalImagesToLoad === 0) {
      // console.log("No images to load, completing immediately");
      handleLoadComplete();
      return;
    }

    let loaded = 0;
    const imagesToLoad: string[] = [];

    if (packTexture) imagesToLoad.push(packTexture);
    cards.forEach((card) => {
      imagesToLoad.push(card.frontImage);
      imagesToLoad.push(card.backImage);
    });

    // console.log("Starting to preload images:", imagesToLoad);

    imagesToLoad.forEach((src) => {
      const img = new Image();

      img.onload = () => {
        loaded++;
        if (loaded >= totalImagesToLoad) {
          // console.log("All images loaded!");
          handleLoadComplete();
        }
      };

      img.onerror = () => {
        loaded++;
        // console.error(`Failed to load image ${src}:`, error);
        if (loaded >= totalImagesToLoad) {
          // console.log("All images processed (some may have failed)");
          handleLoadComplete();
        }
      };

      img.src = src;
    });
  }, [packTexture, cards, totalImagesToLoad]);

  const handleIntroComplete = () => {
    // console.log("intro complete");
    setState("ready");
  };

  const handleRip = () => {
    setState("ripping");
  };

  const handleRipComplete = () => {
    // console.log("rip complete");
    setState("outro");
  };

  const handleOutroComplete = () => {
    // console.log("outro complete");
    setState("cards");
  };

  const mouse = useRef([0, 0]);
  const container = useRef<HTMLDivElement>(null);
  const group = useRef<THREE.Group>(null);

  const onMouseMove = useCallback(
    ({ clientX: x, clientY: y }: React.MouseEvent<HTMLDivElement>) => {
      if (!container.current) return;
      mouse.current = [
        x - container.current.clientWidth / 2,
        y - container.current.clientHeight / 2,
      ];
    },
    [container]
  );

  const isMobile = useMemo(
    () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
    []
  );

  return (
    <div
      ref={container}
      className="aspect-square w-full max-w-[600px] border border-zinc-700 relative bg-zinc-950 overflow-hidden"
    >
      <Canvas
        className="w-full h-full"
        camera={{ position: [0, 0, 4], fov: 25 }}
        shadows={false}
        onMouseMove={onMouseMove}
      >
        <Suspense fallback={null}>
          <Environment files="/neutral.hdr" environmentIntensity={1} />

          <group ref={group}>
            {state !== "loading" && state !== "cards" && (
              <Pack
                ripPack={state === "ripping"}
                playIntro={state === "intro"}
                playOutro={state === "outro"}
                onIntroComplete={handleIntroComplete}
                onRipComplete={handleRipComplete}
                onOutroComplete={handleOutroComplete}
                rotation={[0, -Math.PI / 2, 0]}
                textureUrl={packTexture}
              />
            )}

            <CardsFan
              cards={cards}
              isVisible={state !== "loading" && state !== "intro"}
              isActive={state === "cards"}
            />
          </group>

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableDamping={true}
            minAzimuthAngle={(-10 * Math.PI) / 180}
            maxAzimuthAngle={(10 * Math.PI) / 180}
            minPolarAngle={(80 * Math.PI) / 180}
            maxPolarAngle={(100 * Math.PI) / 180}
            rotateSpeed={0.1}
            dampingFactor={0.05}
          />

          <RipParticles
            active={state === "ripping" || state === "outro"}
            cardsFanned={state === "cards"}
          />

          <fog attach="fog" args={["white", -10, 190]} />

          <Swarm
            count={isMobile ? 1500 : 3000}
            mouse={mouse as React.RefObject<[number, number]>}
          />

          <Clouds material={THREE.MeshLambertMaterial}>
            <Cloud
              seed={1}
              fade={30}
              position={[0, -1, -2]}
              speed={0.5}
              growth={4}
              volume={10}
              opacity={0.5}
              bounds={[1, 2, 1]}
            />
            <pointLight position={[0, 0, 0]} color="blue" />
          </Clouds>

          <Preload all />
        </Suspense>
      </Canvas>

      {/* Loading indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 flex-col gap-4">
          <div className="text-white text-xl">Loading...</div>
        </div>
      )}

      {/* Rip button - only show when ready */}
      <div
        className={clsx(
          "flex gap-2 absolute bottom-4 w-full items-center justify-center",
          "transition-transform duration-300",
          {
            "translate-y-[64px]":
              state === "loading" ||
              state === "intro" ||
              state === "ripping" ||
              state === "outro" ||
              state === "cards",
            "translate-y-0": state === "ready",
          }
        )}
      >
        <button
          className="bg-white text-black px-6 py-3 rounded-md cursor-pointer font-bold hover:bg-gray-200 transition-colors"
          onClick={handleRip}
        >
          Rip Pack
        </button>
      </div>
    </div>
  );
};

export default PackRip;
