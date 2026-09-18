import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { LABIRINT_PIRAT, PUNCTE_PALADIU } from "../utils/labirintPirate.js";

const formaStea = new THREE.Shape();
for (let i = 0; i < 16; i += 1) {
  const unghi = (i / 16) * Math.PI * 2 - Math.PI / 2;
  const raza = i % 2 ? 0.95 : 2.8;
  const x = Math.cos(unghi) * raza;
  const y = Math.sin(unghi) * raza;
  if (i === 0) formaStea.moveTo(x, y);
  else formaStea.lineTo(x, y);
}
formaStea.closePath();
const geometrieStea = new THREE.ShapeGeometry(formaStea);

const vertexCeata = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const fragmentCeata = `
  uniform float uTimp;
  uniform vec3 uCuloare;
  varying vec2 vUv;
  void main() {
    float margini = smoothstep(0.0, 0.19, vUv.x) * smoothstep(0.0, 0.19, 1.0 - vUv.x);
    margini *= smoothstep(0.0, 0.1, vUv.y) * smoothstep(0.0, 0.1, 1.0 - vUv.y);
    float val = 0.66 + 0.18 * sin(vUv.y * 27.0 + uTimp * 0.9)
      + 0.12 * sin(vUv.y * 57.0 - uTimp * 0.5 + vUv.x * 9.0);
    gl_FragColor = vec4(uCuloare, margini * val * 0.31);
    #include <colorspace_fragment>
  }
`;

function CeataPirata({ zid, culoare, index }) {
  const material = useRef();
  const uniforme = useMemo(() => ({
    uTimp: { value: index * 1.9 },
    uCuloare: { value: new THREE.Color(culoare) },
  }), [culoare, index]);
  useFrame(({ clock }) => { if (material.current) material.current.uniforms.uTimp.value = clock.elapsedTime; });
  return (
    <mesh position={[zid.x, 0.7, zid.z]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={6} raycast={() => null}>
      <planeGeometry args={[zid.w + 128, zid.h + 35]} />
      <shaderMaterial ref={material} uniforms={uniforme} vertexShader={vertexCeata} fragmentShader={fragmentCeata}
        transparent depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function PereteMineral({ zid, culoare, index }) {
  const fragmente = useMemo(() => {
    const lungime = Math.max(zid.w, zid.h);
    const nr = Math.ceil(lungime / 33);
    return Array.from({ length: nr }, (_, i) => {
      const fractie = (i + 0.5) / nr - 0.5;
      const abatere = Math.sin((i + 1) * (index + 3) * 2.17) * 5;
      return {
        x: zid.w > zid.h ? fractie * zid.w : abatere,
        z: zid.h > zid.w ? fractie * zid.h : abatere,
        raza: 5.5 + ((i * 7 + index * 13) % 6),
        unghi: (i * 0.92 + index) % Math.PI,
      };
    });
  }, [zid, index]);
  return (
    <group position={[zid.x, 0, zid.z]}>
      <mesh position={[0, -0.65, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <planeGeometry args={[zid.w + 7, zid.h + 7]} />
        <meshBasicMaterial color={culoare} transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <planeGeometry args={[zid.w, zid.h]} />
        <meshBasicMaterial color="#0a111a" transparent opacity={0.88} />
      </mesh>
      {fragmente.map((piatra, i) => (
        <mesh key={i} position={[piatra.x, 0.3, piatra.z]} rotation={[0, piatra.unghi, 0]}
          scale={[piatra.raza, 0.4 + (i % 3) * 0.12, piatra.raza * (0.65 + (i % 4) * 0.1)]}
          raycast={() => null}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={i % 4 ? "#263039" : culoare} metalness={0.38} roughness={0.86} />
        </mesh>
      ))}
    </group>
  );
}

function Steluțe({ tema, colectate, onAlegeTinta }) {
  const puncte = PUNCTE_PALADIU[tema];
  const grupuri = useRef([]);
  useFrame(({ clock }) => {
    for (let i = 0; i < grupuri.current.length; i += 1) {
      const grup = grupuri.current[i];
      if (!grup) continue;
      grup.rotation.y = clock.elapsedTime * (0.45 + (i % 3) * 0.13);
      const puls = 1 + Math.sin(clock.elapsedTime * 2.6 + i * 0.81) * 0.18;
      grup.scale.setScalar(puls);
    }
  });
  return puncte.filter((p) => !colectate.has(p.id)).map((p, index) => (
    <group key={p.id} ref={(el) => { grupuri.current[index] = el; }} position={[p.x, 0.8, p.z]}
      onPointerDown={(e) => { e.stopPropagation(); onAlegeTinta?.({ x: p.x, z: p.z }); }}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.9, 24]} />
        <meshBasicMaterial color="#68e6df" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <primitive object={geometrieStea} attach="geometry" />
        <meshBasicMaterial color="#c3fff1" toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  ));
}

function RafinariaPaladiu({ onAlegeTinta }) {
  const nucleu = useRef();
  useFrame(({ clock }) => { if (nucleu.current) nucleu.current.rotation.y = clock.elapsedTime * 0.65; });
  return (
    <group position={[0, 1.2, 0]} onPointerDown={(e) => { e.stopPropagation(); onAlegeTinta?.({ x: 0, z: 0 }); }}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[12, 17, 48]} />
        <meshBasicMaterial color="#b5a0f2" transparent opacity={0.86} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={nucleu} position={[0, 3.8, 0]} scale={[3.8, 6, 3.8]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#72eadb" emissive="#37a69c" emissiveIntensity={1.9} metalness={0.5} roughness={0.25} />
      </mesh>
      <pointLight color="#82f5dd" intensity={7} distance={38} />
    </group>
  );
}

export default function ZonaPirata({ tema, colectate = new Set(), onAlegeTinta }) {
  const zona = LABIRINT_PIRAT[tema];
  if (!zona) return null;
  return (
    <group>
      {zona.ziduri.map((zid, index) => (
        <group key={`${tema}-${index}`}>
          <PereteMineral zid={zid} culoare={zona.culoare} index={index} />
          <CeataPirata zid={zid} culoare={zona.ceata} index={index} />
        </group>
      ))}
      <Steluțe tema={tema} colectate={colectate} onAlegeTinta={onAlegeTinta} />
      {zona.schimb && <RafinariaPaladiu onAlegeTinta={onAlegeTinta} />}
    </group>
  );
}
