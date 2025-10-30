import { extend, useFrame, useThree } from "@react-three/fiber";
import { MeshLineGeometry, MeshLineMaterial, raycast } from "meshline";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { lerp } from "three/src/math/MathUtils.js";

extend({ MeshLineGeometry, MeshLineMaterial });

type SwarmProps = {
  count: number;
  mouse: React.RefObject<[number, number]>;
};

type LinesProps = {
  mouse: React.RefObject<[number, number]>;
  count: number;
  colors: string[];
  radius?: number;
};

type FatlineProps = {
  curve: THREE.Vector3[];
  width: number;
  color: string;
  speed: number;
};

const Fatline = ({ curve, width, color, speed }: FatlineProps) => {
  const material = useRef<{ uniforms: { dashOffset: { value: number } } }>(
    null
  );

  useFrame(() => {
    if (material.current) {
      material.current.uniforms.dashOffset.value -= speed;
    }
  });

  return (
    <mesh raycast={raycast}>
      <meshLineGeometry points={curve} />
      <meshLineMaterial
        lineWidth={1}
        ref={material}
        lineWidth={width}
        color={color}
        dashArray={0.1}
        dashRatio={0.9}
        transparent={true}
        depthTest={false}
        attach="material"
      />
    </mesh>
  );
};

function r(): number {
  return Math.max(0.5, Math.random());
}

export const Lines = ({ mouse, count, colors, radius = 1 }: LinesProps) => {
  const lines = useMemo(
    () =>
      new Array(count).fill(null).map(() => {
        const pos = new THREE.Vector3(
          Math.sin(0) * radius * r(),
          Math.cos(0) * radius * r(),
          0
        );
        const points = new Array(30).fill(null).map((_, index) => {
          const angle = (index / 20) * Math.PI * 2;
          return pos
            .add(
              new THREE.Vector3(
                Math.sin(angle) * radius * r(),
                Math.cos(angle) * radius * r(),
                0
              )
            )
            .clone();
        });
        const curve = new THREE.CatmullRomCurve3(points).getPoints(500);
        return {
          // eslint-disable-next-line react-hooks/exhaustive-deps
          color: colors[Math.round(colors.length * Math.random())],
          width: 0.01,
          speed: Math.max(0.001, 0.001 * Math.random()),
          curve,
        };
      }),
    []
  );

  const ref = useRef<THREE.Group>(null);
  const { size, viewport } = useThree();
  const aspect = size.width / viewport.width;

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.x = lerp(
        ref.current.rotation.x,
        0 + mouse.current[1] / aspect / 50,
        0.1
      );
      ref.current.rotation.y = lerp(
        ref.current.rotation.y,
        0 + mouse.current[0] / aspect / 100,
        0.1
      );
    }
  });

  return (
    <group ref={ref}>
      <group position={[-radius * 2, -radius, 0]}>
        {lines.map((props, index) => (
          <Fatline key={index} {...props} />
        ))}
      </group>
    </group>
  );
};

export const Swarm = ({ count, mouse }: SwarmProps) => {
  const mesh = useRef<THREE.InstancedMesh>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  // Generate some random positions, speed factors and timings
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.005 + Math.random() / 500;
      const xFactor = -50 + Math.random() * 100;
      const yFactor = -50 + Math.random() * 100;
      const zFactor = -100 + Math.random() * 50;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  }, [count]);
  // The innards of this hook will run every frame
  useFrame(() => {
    // Run through the randomized data to calculate some movement
    particles.forEach((particle, i) => {
      let { t } = particle;
      const { factor, speed, xFactor, yFactor, zFactor } = particle;
      // There is no sense or reason to any of this, just messing around with trigonometric functions
      t = particle.t += speed / 2;
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      const s = Math.cos(t);
      particle.mx += (mouse.current[0] - particle.mx) * 0.01;
      particle.my += (mouse.current[1] * -1 - particle.my) * 0.01;
      // Update the dummy object
      dummy.position.set(
        (particle.mx / 10) * a +
          xFactor +
          Math.cos((t / 10) * factor) +
          (Math.sin(t * 1) * factor) / 10,
        (particle.my / 10) * b +
          yFactor +
          Math.sin((t / 10) * factor) +
          (Math.cos(t * 2) * factor) / 10,
        (particle.my / 10) * b +
          zFactor +
          Math.cos((t / 10) * factor) +
          (Math.sin(t * 3) * factor) / 10
      );
      dummy.scale.set(s, s, s);
      dummy.rotation.set(s * 5, s * 5, s * 5);
      dummy.updateMatrix();
      // And apply the matrix to the instanced item
      mesh.current?.setMatrixAt(i, dummy.matrix);
    });
    if (mesh.current) {
      mesh.current.instanceMatrix.needsUpdate = true;
    }
  });
  return (
    <>
      <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
        <dodecahedronGeometry attach="geometry" args={[0.2, 0]} />
        <meshPhongMaterial attach="material" color="#050505" />
      </instancedMesh>
    </>
  );
};
