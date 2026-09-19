import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { densitateCeataPirata, LABIRINT_PIRAT, PUNCTE_PALADIU } from "../utils/labirintPirate.js";

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
  uniform float uDensitate;
  varying vec2 vUv;
  float zgomot(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453);
    float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
    float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
    float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  void main() {
    vec2 uv = vUv;
    float margini = smoothstep(0.0, 0.24, uv.x) * smoothstep(0.0, 0.24, 1.0 - uv.x);
    margini *= smoothstep(0.0, 0.19, uv.y) * smoothstep(0.0, 0.19, 1.0 - uv.y);
    vec2 curgere = uv * vec2(7.0, 5.0) + vec2(uTimp * 0.035, -uTimp * 0.025);
    float nor = 0.57 * zgomot(curgere)
      + 0.29 * zgomot(curgere * 2.05 + 7.3)
      + 0.14 * zgomot(curgere * 4.1 - uTimp * 0.045);
    float vapori = smoothstep(0.29, 0.68, nor);
    vec3 culoare = mix(uCuloare * 0.52, uCuloare * 1.18, vapori);
    gl_FragColor = vec4(culoare, margini * vapori * uDensitate * 0.62);
    #include <colorspace_fragment>
  }
`;

function CeataPirata({ zid, culoare, index, densitate = 1 }) {
  const material = useRef();
  const uniforme = useMemo(() => ({
    uTimp: { value: index * 1.9 },
    uCuloare: { value: new THREE.Color(culoare) },
    uDensitate: { value: densitate },
  }), [culoare, densitate, index]);
  useFrame(({ clock }) => { if (material.current) material.current.uniforms.uTimp.value = clock.elapsedTime + index * 1.9; });
  return (
    <mesh position={[zid.x, 0.8, zid.z]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={6} raycast={() => null}>
      <planeGeometry args={[zid.w + 72, zid.h + 72]} />
      <shaderMaterial ref={material} uniforms={uniforme} vertexShader={vertexCeata} fragmentShader={fragmentCeata}
        transparent depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function PereteMineral({ zid, culoare, paleta, index }) {
  const rociRef = useRef();
  const piscuriRef = useRef();
  const { fragmente, contur } = useMemo(() => {
    const orizontal = zid.w > zid.h;
    const lungime = Math.max(zid.w, zid.h);
    const grosime = Math.min(zid.w, zid.h);
    const nr = Math.ceil(lungime / 23);
    const fragmente = Array.from({ length: nr }, (_, i) => {
      const fractie = (i + 0.5) / nr - 0.5;
      const abatere = Math.sin((i + 1) * (index + 3) * 2.17) * grosime * 0.15;
      const lungimePiatra = 12 + ((i * 7 + index * 13) % 8);
      const latimePiatra = grosime * (0.31 + ((i * 3 + index) % 5) * 0.075);
      return {
        x: orizontal ? fractie * lungime : abatere,
        z: orizontal ? abatere : fractie * lungime,
        sx: orizontal ? lungimePiatra : latimePiatra,
        sz: orizontal ? latimePiatra : lungimePiatra,
        inaltime: 4.8 + ((i * 11 + index * 5) % 8) * 0.72,
        unghi: (i * 0.92 + index) % Math.PI,
      };
    });
    const contur = new THREE.Shape();
    const puncte = Math.ceil(lungime / 20);
    const coordonate = (lung, lateral) => {
      const x = orizontal ? lung : lateral;
      const z = orizontal ? lateral : lung;
      return [x, -z];
    };
    for (let margine = 0; margine < 2; margine += 1) {
      for (let i = 0; i <= puncte; i += 1) {
        const indice = margine ? puncte - i : i;
        const lung = -lungime / 2 + (indice / puncte) * lungime;
        const val = Math.sin(indice * 2.29 + index * 1.71 + margine * 3.4);
        const lateral = (margine ? -1 : 1) * grosime * (0.40 + val * 0.105);
        const [x, y] = coordonate(lung, lateral);
        if (!margine && !i) contur.moveTo(x, y);
        else contur.lineTo(x, y);
      }
    }
    contur.closePath();
    return { fragmente, contur };
  }, [zid, index]);
  useLayoutEffect(() => {
    if (!rociRef.current || !piscuriRef.current) return;
    const obiect = new THREE.Object3D();
    const baza = new THREE.Color("#20252d");
    const accent = new THREE.Color(culoare);
    fragmente.forEach((piatra, i) => {
      const culoarePiatra = new THREE.Color(paleta[(i + index) % paleta.length]);
      obiect.position.set(piatra.x, 0.25 + (i % 4) * 0.05, piatra.z);
      obiect.rotation.set(0.14 * Math.sin(i * 4.1), piatra.unghi, 0.12 * Math.cos(i * 3.3));
      obiect.scale.set(piatra.sx, 0.75 + (i % 4) * 0.16, piatra.sz);
      obiect.updateMatrix();
      rociRef.current.setMatrixAt(i, obiect.matrix);
      rociRef.current.setColorAt(i, baza.clone().lerp(culoarePiatra, 0.4 + (i % 4) * 0.08));

      obiect.position.set(piatra.x, piatra.inaltime * 0.5, piatra.z);
      obiect.rotation.set(0, piatra.unghi, 0);
      obiect.scale.set(
        Math.max(4.5, piatra.sx * 0.44),
        piatra.inaltime,
        Math.max(4.2, piatra.sz * 0.58),
      );
      obiect.updateMatrix();
      piscuriRef.current.setMatrixAt(i, obiect.matrix);
      piscuriRef.current.setColorAt(i, baza.clone().lerp(culoarePiatra, 0.58 + (i % 4) * 0.08).lerp(accent, 0.08));
    });
    rociRef.current.instanceMatrix.needsUpdate = true;
    if (rociRef.current.instanceColor) rociRef.current.instanceColor.needsUpdate = true;
    piscuriRef.current.instanceMatrix.needsUpdate = true;
    if (piscuriRef.current.instanceColor) piscuriRef.current.instanceColor.needsUpdate = true;
  }, [fragmente, culoare, paleta, index]);
  return (
    <group position={[zid.x, 0, zid.z]}>
      <mesh position={[0, -0.68, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.11, 1.11, 1]} raycast={() => null}>
        <shapeGeometry args={[contur]} />
        <meshBasicMaterial color={culoare} transparent opacity={0.26} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <shapeGeometry args={[contur]} />
        <meshBasicMaterial color="#0b1018" side={THREE.DoubleSide} />
      </mesh>
      <instancedMesh ref={rociRef} args={[null, null, fragmente.length]} raycast={() => null}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#ffffff" metalness={0.18} roughness={0.95} flatShading />
      </instancedMesh>
      <instancedMesh ref={piscuriRef} args={[null, null, fragmente.length]} raycast={() => null} castShadow>
        <coneGeometry args={[1, 1, 7, 1]} />
        <meshStandardMaterial color="#ffffff" metalness={0.12} roughness={0.98} flatShading />
      </instancedMesh>
    </group>
  );
}

function CeataLaNava({ tema, culoare, playerRef }) {
  const grup = useRef();
  const uniforme = useMemo(() => Array.from({ length: 4 }, (_, index) => ({
    uTimp: { value: index * 5.7 },
    uCuloare: { value: new THREE.Color(culoare).multiplyScalar(1.12) },
    uDensitate: { value: 0 },
  })), [culoare]);
  const pozitii = useMemo(() => [
    [-35, 0, -12, 52, 36], [36, 0.12, 5, 48, 34],
    [-15, 0.28, 34, 56, 38], [20, 0.42, -36, 50, 34],
  ], []);

  useFrame(({ clock }) => {
    if (!grup.current || !playerRef?.current) return;
    const x = playerRef.current.x;
    const z = playerRef.current.z;
    const densitate = densitateCeataPirata(tema, x, z);
    grup.current.visible = densitate > 0.025;
    if (!grup.current.visible) return;
    grup.current.position.set(x, 7.4, z);
    grup.current.rotation.y = Math.sin(clock.elapsedTime * 0.16) * 0.24;
    grup.current.position.x += Math.sin(clock.elapsedTime * 0.38) * 4.5;
    grup.current.position.z += Math.cos(clock.elapsedTime * 0.31) * 3.5;
    uniforme.forEach((set, index) => {
      set.uTimp.value = clock.elapsedTime + index * 4.9;
      set.uDensitate.value = Math.min(0.78, densitate * (0.62 + index * 0.045));
    });
  });

  return (
    <group ref={grup} visible={false} renderOrder={45}>
      {pozitii.map(([x, y, z, w, h], index) => (
        <mesh key={index} position={[x, y, z]} rotation={[-Math.PI / 2, 0, index * 0.71]} renderOrder={45 + index} raycast={() => null}>
          <planeGeometry args={[w, h]} />
          <shaderMaterial uniforms={uniforme[index]} vertexShader={vertexCeata} fragmentShader={fragmentCeata}
            transparent depthWrite={false} depthTest={false} side={THREE.DoubleSide} />
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
        <circleGeometry args={[19, 8]} />
        <meshStandardMaterial color="#151d24" metalness={0.72} roughness={0.53} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 8]}>
        <ringGeometry args={[12.5, 16.5, 8]} />
        <meshStandardMaterial color="#6b6251" metalness={0.8} roughness={0.42} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.34, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[16.7, 18, 8]} />
        <meshBasicMaterial color="#d99d5b" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const unghi = (i / 8) * Math.PI * 2;
        return <mesh key={i} position={[Math.cos(unghi) * 15, 1.25, Math.sin(unghi) * 15]} rotation={[0, -unghi, 0]}>
          <boxGeometry args={[4.2, 2.6, 5.8]} />
          <meshStandardMaterial color={i % 2 ? "#42545a" : "#675b4d"} metalness={0.79} roughness={0.43} />
        </mesh>;
      })}
      <mesh ref={nucleu} position={[0, 3.8, 0]} scale={[3.8, 5.4, 3.8]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#e3bc72" emissive="#b87828" emissiveIntensity={1.7} metalness={0.55} roughness={0.3} />
      </mesh>
      <pointLight color="#f1ba76" intensity={7} distance={42} />
    </group>
  );
}

export default function ZonaPirata({ tema, colectate = new Set(), onAlegeTinta, playerRef }) {
  const zona = LABIRINT_PIRAT[tema];
  if (!zona) return null;
  return (
    <group>
      {zona.ziduri.map((zid, index) => (
        <group key={`${tema}-${index}`}>
          <PereteMineral zid={zid} culoare={zona.culoare} paleta={zona.culoriRelief} index={index} />
          <CeataPirata zid={zid} culoare={zona.ceata} index={index} densitate={0.48} />
        </group>
      ))}
      {zona.nori.map((nor, index) => (
        <CeataPirata key={`nor-${tema}-${index}`} zid={nor} culoare={zona.ceata} index={zona.ziduri.length + index} densitate={0.72} />
      ))}
      <CeataLaNava tema={tema} culoare={zona.ceata} playerRef={playerRef} />
      <Steluțe tema={tema} colectate={colectate} onAlegeTinta={onAlegeTinta} />
      {zona.schimb && <RafinariaPaladiu onAlegeTinta={onAlegeTinta} />}
    </group>
  );
}
