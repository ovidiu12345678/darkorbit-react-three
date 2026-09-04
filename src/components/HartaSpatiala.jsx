import { useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const vertexShaderStatie = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShaderStatie = `
  uniform sampler2D uTexture;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec4 tex = texture2D(uTexture, vUv);

    float puls = 0.9 + 0.1 * sin(uTime * 0.5);
    vec3 culoare = tex.rgb * puls;

    gl_FragColor = vec4(culoare, tex.a);
  }
`;

function TintaIndicator({ tinta }) {
  const indicator = useRef();

  useFrame(({ clock }) => {
    if (!indicator.current) return;
    indicator.current.rotation.y = clock.elapsedTime * 1.8;
    const puls = 1 + Math.sin(clock.elapsedTime * 5.4) * 0.08;
    indicator.current.scale.setScalar(puls);
  });

  if (!tinta) return null;

  return (
    <group ref={indicator} position={[tinta[0], 0.55, tinta[2]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 2.1, 64]} />
        <meshBasicMaterial color="#7dffef" transparent opacity={0.86} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.32, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color="#7dffef" intensity={3.2} distance={10} />
    </group>
  );
}

function PoartaSalt({ pozitie, culoare = "#39f5ff" }) {
  const poarta = useRef();

  useFrame(({ clock }) => {
    if (!poarta.current) return;
    poarta.current.children[0].rotation.z = clock.elapsedTime * 0.55;
    poarta.current.children[1].rotation.z = -clock.elapsedTime * 0.85;
  });

  return (
    <group ref={poarta} position={pozitie}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[3.4, 0.14, 18, 128]} />
        <meshStandardMaterial color="#0a1020" emissive={culoare} emissiveIntensity={1.5} roughness={0.32} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.35, 0.055, 12, 96]} />
        <meshBasicMaterial color={culoare} transparent opacity={0.62} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[2.15, 2.15, 0.08, 48]} />
        <meshBasicMaterial color={culoare} transparent opacity={0.13} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <ringGeometry args={[4.15, 4.35, 64]} />
        <meshBasicMaterial color={culoare} transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color={culoare} intensity={3.2} distance={16} />
    </group>
  );
}

function NodExtractie({ pozitie, culoare = "#7dffef" }) {
  const cristal = useRef();

  useFrame(({ clock }) => {
    if (!cristal.current) return;
    cristal.current.rotation.y = clock.elapsedTime * 0.9;
    cristal.current.position.y = 1.65 + Math.sin(clock.elapsedTime * 2.2 + pozitie[0]) * 0.12;
  });

  return (
    <group position={pozitie}>
      <mesh position={[0, 0.28, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.25, 1.55, 0.55, 8]} />
        <meshStandardMaterial color="#202839" metalness={0.7} roughness={0.42} />
      </mesh>
      <mesh ref={cristal} position={[0, 1.65, 0]} castShadow>
        <octahedronGeometry args={[0.95, 1]} />
        <meshStandardMaterial color={culoare} emissive={culoare} emissiveIntensity={1.45} roughness={0.18} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[1.65, 1.82, 36]} />
        <meshBasicMaterial color={culoare} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color={culoare} intensity={1.7} distance={9} />
    </group>
  );
}

function CutieBonus({ pozitie, culoare = "#ffd35a" }) {
  const cutie = useRef();

  useFrame(({ clock }) => {
    if (!cutie.current) return;
    cutie.current.rotation.y = clock.elapsedTime * 0.95 + pozitie[0];
    cutie.current.position.y = 1.05 + Math.sin(clock.elapsedTime * 2.4 + pozitie[2]) * 0.08;
  });

  return (
    <group position={pozitie}>
      <mesh ref={cutie} castShadow scale={[0.72, 0.72, 0.72]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#1d2532" metalness={0.72} roughness={0.22} emissive={culoare} emissiveIntensity={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[0.95, 1.1, 32]} />
        <meshBasicMaterial color={culoare} transparent opacity={0.34} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color={culoare} intensity={1.2} distance={6} />
    </group>
  );
}

const MARIME_STATIE_MICA = 22;
const MARIME_STATIE_MARE = 130;
const RAZA_APROPIERE_STATIE = 80;
const OFFSET_VERTICAL_STATIE = 0.18;

function StatieSector({ pozitie, playerRef }) {
  const sprite = useRef();
  const texturaStatie = useLoader(THREE.TextureLoader, `${import.meta.env.BASE_URL}assets/Statie_MMO_rgba.png`);
  texturaStatie.colorSpace = THREE.SRGBColorSpace;
  texturaStatie.generateMipmaps = false;
  texturaStatie.minFilter = THREE.LinearFilter;
  texturaStatie.magFilter = THREE.LinearFilter;

  const uniformeStatie = useMemo(() => ({ uTexture: { value: texturaStatie }, uTime: { value: 0 } }), [texturaStatie]);
  const pozitieVector = useMemo(() => new THREE.Vector3(...pozitie), [pozitie]);
  const scaraCurenta = useRef(MARIME_STATIE_MICA);

  useFrame(({ camera, clock }) => {
    if (!sprite.current) return;
    sprite.current.quaternion.copy(camera.quaternion);
    uniformeStatie.uTime.value = clock.elapsedTime;

    if (playerRef?.current) {
      const distanta = playerRef.current.distanceTo(pozitieVector);
      const tinta = distanta < RAZA_APROPIERE_STATIE ? MARIME_STATIE_MARE : MARIME_STATIE_MICA;
      scaraCurenta.current = THREE.MathUtils.lerp(scaraCurenta.current, tinta, 0.035);
    }

    sprite.current.scale.set(scaraCurenta.current, scaraCurenta.current, 1);
    sprite.current.position.y = scaraCurenta.current * OFFSET_VERTICAL_STATIE;
  });

  return (
    <group position={pozitie}>
      <mesh ref={sprite}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          uniforms={uniformeStatie}
          vertexShader={vertexShaderStatie}
          fragmentShader={fragmentShaderStatie}
          transparent
          depthWrite={false}
          depthTest={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <pointLight color="#36f5ff" intensity={2.7} distance={70} />
    </group>
  );
}

const MARIME_HANGAR_MICA = 24;
const MARIME_HANGAR_MARE = 140;
const RAZA_APROPIERE_HANGAR = 80;
const OFFSET_VERTICAL_HANGAR = 0.18;

function HangarSector({ pozitie, playerRef }) {
  const sprite = useRef();
  const texturaHangar = useLoader(THREE.TextureLoader, `${import.meta.env.BASE_URL}assets/Hangar.png`);
  texturaHangar.colorSpace = THREE.SRGBColorSpace;
  texturaHangar.generateMipmaps = false;
  texturaHangar.minFilter = THREE.LinearFilter;
  texturaHangar.magFilter = THREE.LinearFilter;

  const uniformeHangar = useMemo(() => ({ uTexture: { value: texturaHangar }, uTime: { value: 0 } }), [texturaHangar]);
  const pozitieVector = useMemo(() => new THREE.Vector3(...pozitie), [pozitie]);
  const scaraCurenta = useRef(MARIME_HANGAR_MICA);

  useFrame(({ camera, clock }) => {
    if (!sprite.current) return;
    sprite.current.quaternion.copy(camera.quaternion);
    uniformeHangar.uTime.value = clock.elapsedTime;

    if (playerRef?.current) {
      const distanta = playerRef.current.distanceTo(pozitieVector);
      const tinta = distanta < RAZA_APROPIERE_HANGAR ? MARIME_HANGAR_MARE : MARIME_HANGAR_MICA;
      scaraCurenta.current = THREE.MathUtils.lerp(scaraCurenta.current, tinta, 0.035);
    }

    sprite.current.scale.set(scaraCurenta.current, scaraCurenta.current, 1);
    sprite.current.position.y = scaraCurenta.current * OFFSET_VERTICAL_HANGAR;
  });

  return (
    <group position={pozitie}>
      <mesh ref={sprite}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          uniforms={uniformeHangar}
          vertexShader={vertexShaderStatie}
          fragmentShader={fragmentShaderStatie}
          transparent
          depthWrite={false}
          depthTest={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <pointLight color="#ff8a3c" intensity={2.7} distance={70} />
    </group>
  );
}

function FundalDistant({ textura, latime, inaltime }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.4, 0]}>
      <planeGeometry args={[latime, inaltime]} />
      <meshBasicMaterial map={textura} color="#ffffff" toneMapped={false} fog={false} depthWrite={false} />
    </mesh>
  );
}

const FUNDAL_TILE_LATIME = 280;
const FUNDAL_TILE_INALTIME = 158;

const POZITIE_STATIE_INITIALA = [-550.4, 0.38, -16.1];
const POZITIE_HANGAR_INITIALA = [505, 0.38, -137];

export default function HartaSpatiala({
  marimeHarta,
  onAlegeTinta,
  tintaJucator,
  onStareClic,
  playerRef,
  pozitieStatie = POZITIE_STATIE_INITIALA,
  pozitieHangar = POZITIE_HANGAR_INITIALA,
}) {
  const latimeHarta = marimeHarta * (16 / 9);
  const inaltimeHarta = marimeHarta;
  const factorScalare = marimeHarta / 210;

  const fundalLatime = inaltimeHarta * 2.67 * 1.7768;
  const fundalInaltime = inaltimeHarta * 2.67;

  const texturaHarta = useLoader(THREE.TextureLoader, `${import.meta.env.BASE_URL}assets/harta-spatiala-fundal-hi.jpg`);

  useEffect(() => {
    texturaHarta.colorSpace = THREE.SRGBColorSpace;
    texturaHarta.anisotropy = 16;
    texturaHarta.wrapS = THREE.RepeatWrapping;
    texturaHarta.wrapT = THREE.RepeatWrapping;
    texturaHarta.repeat.set(fundalLatime / FUNDAL_TILE_LATIME, fundalInaltime / FUNDAL_TILE_INALTIME);
    texturaHarta.offset.set(0.32, 0.4);
    texturaHarta.needsUpdate = true;
  }, [texturaHarta, fundalLatime, fundalInaltime]);

  const geometrie = useMemo(
    () => new THREE.PlaneGeometry(latimeHarta, inaltimeHarta),
    [latimeHarta, inaltimeHarta]
  );

  const clicApasat = useRef(false);

  const candAlegeTinta = (eveniment) => {
    eveniment.stopPropagation();
    clicApasat.current = true;
    onStareClic?.(true);
    onAlegeTinta?.(eveniment.point);
  };

  const candMiscaCursorul = (eveniment) => {
    if (!clicApasat.current) return;
    eveniment.stopPropagation();
    onAlegeTinta?.(eveniment.point);
  };

  const candElibereazaClicul = () => {
    if (!clicApasat.current) return;
    clicApasat.current = false;
    onStareClic?.(false);
  };

  useEffect(() => {
    window.addEventListener("pointerup", candElibereazaClicul);
    return () => window.removeEventListener("pointerup", candElibereazaClicul);
  }, []);

  return (
    <group>
      <FundalDistant textura={texturaHarta} latime={fundalLatime} inaltime={fundalInaltime} />

      <mesh
        geometry={geometrie}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.16, 0]}
        onPointerDown={candAlegeTinta}
        onPointerMove={candMiscaCursorul}
        onPointerUp={candElibereazaClicul}
        onPointerLeave={candElibereazaClicul}
        onPointerCancel={candElibereazaClicul}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <PoartaSalt pozitie={[marimeHarta * 0.34, 0.76, marimeHarta * 0.34]} culoare="#32f7ff" />
      <PoartaSalt pozitie={[-marimeHarta * 0.36, 0.76, -marimeHarta * 0.3]} culoare="#ff4add" />

      <StatieSector pozitie={pozitieStatie} playerRef={playerRef} />

      <HangarSector pozitie={pozitieHangar} playerRef={playerRef} />

      <NodExtractie pozitie={[18 * factorScalare, 0, 16 * factorScalare]} culoare="#7dffef" />
      <NodExtractie pozitie={[-22 * factorScalare, 0, -12 * factorScalare]} culoare="#ffd35a" />
      <NodExtractie pozitie={[6 * factorScalare, 0, -36 * factorScalare]} culoare="#8cff6b" />

      <CutieBonus pozitie={[12 * factorScalare, 0, -6 * factorScalare]} culoare="#ffd35a" />
      <CutieBonus pozitie={[-17 * factorScalare, 0, 24 * factorScalare]} culoare="#36f5ff" />
      <CutieBonus pozitie={[30 * factorScalare, 0, 4 * factorScalare]} culoare="#ff4add" />
      <CutieBonus pozitie={[-35 * factorScalare, 0, -26 * factorScalare]} culoare="#8cff6b" />
      <CutieBonus pozitie={[3 * factorScalare, 0, 29 * factorScalare]} culoare="#ffd35a" />

      <TintaIndicator tinta={tintaJucator} />
    </group>
  );
}
