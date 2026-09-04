import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function numarAleator(seed) {
  let stare = seed;
  return () => {
    stare = (stare * 1664525 + 1013904223) % 4294967296;
    return stare / 4294967296;
  };
}

function Asteroid({ pozitie, scara, rotatie, culoare }) {
  const asteroid = useRef();
  const vitezaRotatie = useMemo(
    () => ({
      x: 0.08 + Math.random() * 0.08,
      y: 0.04 + Math.random() * 0.1,
      z: 0.03 + Math.random() * 0.07,
    }),
    []
  );

  useFrame((_, delta) => {
    if (!asteroid.current) return;
    asteroid.current.rotation.x += vitezaRotatie.x * delta;
    asteroid.current.rotation.y += vitezaRotatie.y * delta;
    asteroid.current.rotation.z += vitezaRotatie.z * delta;
  });

  return (
    <group ref={asteroid} position={pozitie} rotation={rotatie} scale={scara}>
      <mesh castShadow receiveShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color={culoare} roughness={0.93} metalness={0.18} />
      </mesh>
      <mesh scale={[1.03, 1.03, 1.03]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#0af7ff" transparent opacity={0.035} wireframe />
      </mesh>
    </group>
  );
}

function FragmentMetalic({ pozitie, scara, culoare }) {
  const fragment = useRef();

  useFrame(({ clock }) => {
    if (!fragment.current) return;
    fragment.current.rotation.y = clock.elapsedTime * 0.55 + pozitie[0];
    fragment.current.position.y = pozitie[1] + Math.sin(clock.elapsedTime * 1.7 + pozitie[2]) * 0.16;
  });

  return (
    <group ref={fragment} position={pozitie} scale={scara}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.9, 0.18, 0.52]} />
        <meshStandardMaterial color="#2f3d4c" metalness={0.85} roughness={0.34} />
      </mesh>
      <mesh position={[1.05, 0, 0]}>
        <sphereGeometry args={[0.14, 12, 8]} />
        <meshBasicMaterial color={culoare} />
      </mesh>
      <pointLight color={culoare} intensity={0.6} distance={4} />
    </group>
  );
}

export default function CampAsteroizi({ marimeHarta = 120 }) {
  const obiecte = useMemo(() => {
    const random = numarAleator(40521);
    const rezultat = [];
    const limita = marimeHarta / 2 - 10;

    for (let index = 0; index < 34; index += 1) {
      const x = (random() * 2 - 1) * limita;
      const z = (random() * 2 - 1) * limita;
      const distantaCentru = Math.sqrt(x * x + z * z);

      if (distantaCentru < 9) {
        continue;
      }

      const dimensiune = 0.65 + random() * 1.75;
      rezultat.push({
        tip: "asteroid",
        pozitie: [x, 0.9 + random() * 2.8, z],
        scara: [dimensiune * (0.8 + random() * 0.7), dimensiune * (0.7 + random() * 0.8), dimensiune],
        rotatie: [random() * Math.PI, random() * Math.PI, random() * Math.PI],
        culoare: random() > 0.55 ? "#62666f" : "#3f4654",
      });
    }

    [
      [-12, 3.1, 27, "#ffd35a"],
      [31, 2.4, 6, "#36f5ff"],
      [-33, 2.8, -28, "#ff4add"],
      [7, 2.2, -18, "#8cff6b"],
    ].forEach(([x, y, z, culoare], index) => {
      rezultat.push({
        tip: "metal",
        pozitie: [x, y, z],
        scara: [1 + index * 0.08, 1 + index * 0.05, 1],
        culoare,
      });
    });

    return rezultat;
  }, [marimeHarta]);

  return (
    <group>
      {obiecte.map((obiect, index) =>
        obiect.tip === "metal" ? (
          <FragmentMetalic key={index} {...obiect} />
        ) : (
          <Asteroid key={index} {...obiect} />
        )
      )}
    </group>
  );
}
