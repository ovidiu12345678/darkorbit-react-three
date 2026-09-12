import { useFrame, useLoader } from "@react-three/fiber";
import { useCallback, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const RAZA_DETECTIE = 24;
const RAZA_ATAC = 15;
const DISTANTA_ORBITA = 8;
const VITEZA_INAMIC = 2.4;
const POZITIE_ZONA_SIGURA = new THREE.Vector3(-532.4, 0, -16.1);
const RAZA_ZONA_SIGURA = 26;
const VITEZA_PROIECTIL = 30;
const PRAG_FUGA = 0.1;
const VITEZA_FUGA = VITEZA_INAMIC * 1.5;
const RAZA_SOSIRE_FUGA = 6;
const DAUNA_PROIECTIL = 2700;

function alegePunctFuga(marimeHarta) {
  const limitaHarta = marimeHarta / 2 - 4.5;
  const margine = limitaHarta * 0.92;
  const semn = Math.random() < 0.5 ? -1 : 1;
  const liber = (Math.random() - 0.5) * 2 * limitaHarta;

  return Math.random() < 0.5
    ? new THREE.Vector3(semn * margine, 0, liber)
    : new THREE.Vector3(liber, 0, semn * margine);
}

const vertexShaderOrnament = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShaderOrnament = `
  uniform sampler2D uTexture;
  uniform float uOpacity;
  uniform float uFlash;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    float distCentru = abs(vUv.x - 0.45);
    float amplitudine = distCentru * 0.045;
    vec2 uvBalans = vUv + vec2(0.0, sin(uTime * 2.1 + vUv.x * 4.2) * amplitudine);

    vec4 tex = texture2D(uTexture, uvBalans);

    float alfaMargine = smoothstep(0.0, 0.04, uvBalans.x) *
      (1.0 - smoothstep(0.96, 1.0, uvBalans.x));

    alfaMargine *= smoothstep(0.0, 0.04, uvBalans.y) *
      (1.0 - smoothstep(0.96, 1.0, uvBalans.y));

    vec3 culoare = tex.rgb;

    vec2 centruOchi = vec2(0.2, 0.85);
    float distOchi = length(vUv - centruOchi);
    float clipire = pow(0.5 + 0.5 * sin(uTime * 0.7), 24.0);
    float mascaOchi = 1.0 - smoothstep(0.025, 0.07, distOchi);
    culoare = mix(culoare, culoare * 0.12, mascaOchi * clipire * 0.85);

    culoare = mix(culoare, vec3(1.0, 1.0, 1.0), uFlash * 0.55) * (1.0 + uFlash * 0.7);

    gl_FragColor = vec4(culoare, tex.a * alfaMargine * uOpacity);
  }
`;

function ProiectilOrnament({ id, start, directie, culoare, playerRef, onLovitura, onSterge }) {
  const proiectil = useRef();
  const viata = useRef(2.6);
  const eliminat = useRef(false);
  const directieVector = useMemo(
    () => new THREE.Vector3(directie[0], directie[1], directie[2]).normalize(),
    [directie]
  );

  useFrame((_, deltaBrut) => {
    if (!proiectil.current || eliminat.current) return;

    const delta = Math.min(deltaBrut, 0.05);
    proiectil.current.position.addScaledVector(directieVector, VITEZA_PROIECTIL * delta);
    viata.current -= delta;

    const distantaJucator = proiectil.current.position.distanceTo(playerRef.current);
    if (distantaJucator < 1.55) {
      eliminat.current = true;
      onLovitura(DAUNA_PROIECTIL);
      onSterge(id);
      return;
    }

    if (viata.current <= 0) {
      eliminat.current = true;
      onSterge(id);
    }
  });

  return (
    <group ref={proiectil} position={start}>
      <mesh>
        <sphereGeometry args={[0.4, 16, 12]} />
        <meshBasicMaterial color={culoare} transparent opacity={0.95} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[0.62, 0.62, 2.4]}>
        <coneGeometry args={[0.28, 1, 16]} />
        <meshBasicMaterial color={culoare} transparent opacity={0.34} depthWrite={false} />
      </mesh>
      <pointLight color={culoare} intensity={2.8} distance={8} />
    </group>
  );
}

const HP_MAX = 1450000;
const SCUT_MAX = 560000;

export default function InamicOrnament({
  id = "ornament",
  pozitie = [0, 2.2, 0],
  scara = 1,
  culoare = "#ff4a4a",
  playerRef,
  onLovitura,
  activ = true,
  selectat = false,
  impulsLovitura = 0,
  hp = HP_MAX,
  scut = SCUT_MAX,
  hpMax = HP_MAX,
  scutMax = SCUT_MAX,
  marimeHarta = 1260,
  onSelectare,
  onAtac,
  onPozitie,
}) {
  const texturaOrnament = useLoader(THREE.TextureLoader, `${import.meta.env.BASE_URL}assets/inamic-ornament.webp`);
  texturaOrnament.colorSpace = THREE.SRGBColorSpace;
  texturaOrnament.anisotropy = 16;

  const uniformeOrnament = useMemo(
    () => ({
      uTexture: { value: texturaOrnament },
      uOpacity: { value: 1 },
      uFlash: { value: 0 },
      uTime: { value: 0 },
    }),
    [texturaOrnament]
  );

  const inamic = useRef();
  const sprite = useRef();
  const inel = useRef();
  const bara = useRef();
  const stare = useRef({
    baza: new THREE.Vector3(pozitie[0], pozitie[1], pozitie[2]),
    cooldown: 1.3 + Math.random() * 1.1,
    offset: Math.random() * Math.PI * 2,
    modAgresiv: false,
    modFuga: false,
    unghiVizual: 0,
    tintaFuga: null,
  });
  const ultimulImpuls = useRef(impulsLovitura);
  const flashLovitura = useRef(0);
  const [proiectile, seteazaProiectile] = useState([]);

  const vectoriTemp = useMemo(
    () => ({
      catreJucator: new THREE.Vector3(),
      lateral: new THREE.Vector3(),
    }),
    []
  );

  const stergeProiectil = useCallback((proiectilId) => {
    seteazaProiectile((lista) => lista.filter((proiectil) => proiectil.id !== proiectilId));
  }, []);

  const candSelecteaza = useCallback(
    (eveniment) => {
      eveniment.stopPropagation();
      onSelectare?.(id);
    },
    [id, onSelectare]
  );

  const candAtaca = useCallback(
    (eveniment) => {
      eveniment.stopPropagation();
      onAtac?.(id);
    },
    [id, onAtac]
  );

  useFrame((stareR3F, deltaBrut) => {
    if (!inamic.current || !playerRef?.current) return;

    const delta = Math.min(deltaBrut, 0.05);
    const { clock, camera } = stareR3F;

    if (impulsLovitura && impulsLovitura !== ultimulImpuls.current) {
      ultimulImpuls.current = impulsLovitura;
      flashLovitura.current = 1;
    }
    flashLovitura.current = Math.max(0, flashLovitura.current - delta * 2.6);

    const obiect = inamic.current;
    const baza = stare.current.baza;
    const player = playerRef.current;

    onPozitie?.(id, obiect.position);

    const catreJucator = vectoriTemp.catreJucator.set(
      player.x - obiect.position.x,
      0,
      player.z - obiect.position.z
    );
    const distanta = catreJucator.length();
    stare.current.cooldown -= delta;

    const jucatorInZonaSigura = player.distanceTo(POZITIE_ZONA_SIGURA) < RAZA_ZONA_SIGURA;
    const inPragFuga = hp <= hpMax * PRAG_FUGA && scut <= scutMax * PRAG_FUGA;

    if (inPragFuga) {
      stare.current.modAgresiv = false;
      stare.current.modFuga = true;

      if (!stare.current.tintaFuga || obiect.position.distanceTo(stare.current.tintaFuga) < RAZA_SOSIRE_FUGA) {
        stare.current.tintaFuga = alegePunctFuga(marimeHarta);
      }

      const directieFuga = vectoriTemp.catreJucator
        .copy(stare.current.tintaFuga)
        .sub(obiect.position);
      directieFuga.y = 0;

      if (directieFuga.lengthSq() > 0.0001) {
        directieFuga.normalize();
        obiect.position.addScaledVector(directieFuga, VITEZA_FUGA * delta);
        stare.current.unghiVizual = THREE.MathUtils.lerp(
          stare.current.unghiVizual,
          Math.atan2(directieFuga.x, directieFuga.z),
          0.12
        );
      }
    } else if (distanta < RAZA_DETECTIE && !jucatorInZonaSigura) {
      stare.current.modFuga = false;
      stare.current.modAgresiv = true;
      const directie = catreJucator.normalize();
      const lateral = vectoriTemp.lateral.set(-directie.z, 0, directie.x);
      const factorOrbita = Math.sin(clock.elapsedTime * 1.5 + stare.current.offset);

      if (distanta > DISTANTA_ORBITA) {
        obiect.position.addScaledVector(directie, VITEZA_INAMIC * delta);
      } else if (distanta < DISTANTA_ORBITA - 4) {
        obiect.position.addScaledVector(directie, -VITEZA_INAMIC * 0.7 * delta);
      }

      obiect.position.addScaledVector(lateral, factorOrbita * 1.8 * delta);
      stare.current.unghiVizual = THREE.MathUtils.lerp(
        stare.current.unghiVizual,
        Math.atan2(directie.x, directie.z),
        0.12
      );

      if (distanta < RAZA_ATAC && stare.current.cooldown <= 0) {
        const start = obiect.position.clone().add(new THREE.Vector3(0, 0.08, 0));
        const tinta = player
          .clone()
          .add(new THREE.Vector3((Math.random() - 0.5) * 2.2, 0.1, (Math.random() - 0.5) * 2.2));
        const directieProiectil = tinta.sub(start).normalize();
        const proiectilNou = {
          id: `${id}-${clock.elapsedTime.toFixed(3)}-${Math.random().toString(16).slice(2)}`,
          start: start.toArray(),
          directie: directieProiectil.toArray(),
        };

        seteazaProiectile((lista) => [...lista.slice(-9), proiectilNou]);
        stare.current.cooldown = 2.1 + Math.random() * 1.2;
      }
    } else {
      stare.current.modAgresiv = false;
      stare.current.modFuga = false;
      const timp = clock.elapsedTime * 0.24 + stare.current.offset;
      obiect.position.x = THREE.MathUtils.lerp(obiect.position.x, baza.x + Math.cos(timp) * 5.8, 0.02);
      obiect.position.z = THREE.MathUtils.lerp(obiect.position.z, baza.z + Math.sin(timp * 1.2) * 4.6, 0.02);
    }

    obiect.position.y = baza.y + Math.sin(clock.elapsedTime * 1.7 + stare.current.offset) * 0.24;

    if (sprite.current) {
      sprite.current.quaternion.copy(camera.quaternion);
      sprite.current.rotation.z -= stare.current.unghiVizual;
      sprite.current.material.uniforms.uTime.value = clock.elapsedTime;
      sprite.current.material.uniforms.uFlash.value =
        flashLovitura.current + (stare.current.modAgresiv ? Math.max(0, Math.sin(clock.elapsedTime * 9)) * 0.25 : 0);
    }

    if (inel.current) {
      inel.current.rotation.z += delta * (selectat ? 1.4 : 0.4);
    }

    if (bara.current) {
      bara.current.quaternion.copy(camera.quaternion);
    }
  });

  const procentScut = THREE.MathUtils.clamp(scut / scutMax, 0, 1);
  const procentHp = THREE.MathUtils.clamp(hp / hpMax, 0, 1);

  if (!activ) {
    return null;
  }

  return (
    <>
      <group ref={inamic} position={pozitie} scale={scara}>
        <mesh
          onPointerDown={candSelecteaza}
          onDoubleClick={candAtaca}
          visible={false}
          scale={[4.2, 3.1, 1]}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        <mesh ref={sprite} scale={[3.9, 2.87, 1]}>
          <planeGeometry args={[1, 1]} />
          <shaderMaterial
            uniforms={uniformeOrnament}
            vertexShader={vertexShaderOrnament}
            fragmentShader={fragmentShaderOrnament}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>

        {selectat && (
          <mesh ref={inel} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.25, 0]}>
            <ringGeometry args={[2.6, 2.88, 48]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
        )}

        <group ref={bara} position={[0, 2.15, 0]}>
          <mesh position={[0, 0.16, 0]}>
            <planeGeometry args={[1.9, 0.13]} />
            <meshBasicMaterial color="#021018" transparent opacity={0.55} depthWrite={false} />
          </mesh>
          <mesh position={[-0.95 + 0.95 * procentScut, 0.16, 0.001]} scale={[Math.max(procentScut, 0.0001), 1, 1]}>
            <planeGeometry args={[1.9, 0.1]} />
            <meshBasicMaterial color="#3ad9ff" transparent opacity={0.95} depthWrite={false} toneMapped={false} />
          </mesh>

          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[1.9, 0.13]} />
            <meshBasicMaterial color="#1a0a06" transparent opacity={0.55} depthWrite={false} />
          </mesh>
          <mesh position={[-0.95 + 0.95 * procentHp, 0, 0.001]} scale={[Math.max(procentHp, 0.0001), 1, 1]}>
            <planeGeometry args={[1.9, 0.1]} />
            <meshBasicMaterial color="#ff5a3c" transparent opacity={0.95} depthWrite={false} toneMapped={false} />
          </mesh>
        </group>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, 0]}>
          <ringGeometry args={[2.0, 2.3, 42]} />
          <meshBasicMaterial color={culoare} transparent opacity={0.32} side={THREE.DoubleSide} />
        </mesh>

        <pointLight color={culoare} intensity={4.6} distance={16} />
      </group>

      {proiectile.map((proiectil) => (
        <ProiectilOrnament
          key={proiectil.id}
          {...proiectil}
          culoare={culoare}
          playerRef={playerRef}
          onLovitura={onLovitura}
          onSterge={stergeProiectil}
        />
      ))}
    </>
  );
}
