import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const Parallax = ({
  group,
  mouse,
}: {
  group: React.RefObject<THREE.Group>;
  mouse: React.RefObject<[number, number]>;
}) => {
  useFrame(() => {
    group.current.setRotationFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      mouse.current[0] * 0.01
    );
    group.current.setRotationFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      mouse.current[1] * 0.001
    );
  });

  return null;
};

export default Parallax;
