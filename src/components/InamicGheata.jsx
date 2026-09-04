import { useFrame, useLoader } from "@react-three/fiber";
import { useCallback, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const RAZA_DETECTIE = 20;
const RAZA_ATAC = 13;
const DISTANTA_ORBITA = 7;
const VITEZA_INAMIC = 3;
const POZITIE_ZONA_SIGURA = new THREE.Vector3(-532.4, 0, -16.1);
const RAZA_ZONA_SIGURA = 26;
const VITEZA_PROIECTIL = 30;
const PRAG_FUGA = 0.1;
const VITEZA_FUGA = 6;
const RAZA_SOSIRE_FUGA = 6;

function alegePunctFuga(marimeHarta) {
  const limitaHarta = marimeHarta / 2 - 4.5;
  const margine = limitaHarta * 0.92;
  const semn = Math.random() < 0.5 ? -1 : 1;
  const liber = (Math.random() - 0.5) * 2 * limitaHarta;

  return Math.random() < 0.5
    ? new THREE.Vector3(semn * margine, 0, liber)
    : new THREE.Vector3(liber, 0, semn * margine);
}

const vertexShaderAlien = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShaderAlien = `
  uniform sampler2D uTexture;
  uniform float uOpacity;
  uniform float uFlash;
  varying vec2 vUv;

  void main() {
    vec4 tex = texture2D(uTexture, vUv);

    float alfaFundal = tex.a;

    float alfaMargine = smoothstep(0.0, 0.05, vUv.x) *
      (1.0 - smoothstep(0.95, 1.0, vUv.x));

    alfaMargine *= smoothstep(0.0, 0.05, vUv.y) *
      (1.0 - smoothstep(0.95, 1.0, vUv.y));

    vec3 culoare = mix(tex.rgb, vec3(1.0, 1.0, 1.0), uFlash * 0.55) * (1.0 + uFlash * 0.7);

    gl_FragColor = vec4(culoare, alfaFundal * alfaMargine * uOpacity);
  }
`;

function ProiectilAlien({ id, start, directie, culoare, playerRef, onLovitura, onSterge }) {
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
      onLovitura(8, 1500);
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
        <sphereGeometry args={[0.34, 16, 12]} />
        <meshBasicMaterial color={culoare} transparent opacity={0.95} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[0.55, 0.55, 2.2]}>
        <coneGeometry args={[0.25, 1, 16]} />
        <meshBasicMaterial color={culoare} transparent opacity={0.34} depthWrite={false} />
      </mesh>
      <pointLight color={culoare} intensity={2.5} distance={7} />
    </group>
  );
}

const HP_MAX = 5000;
const SCUT_MAX = 500;

export default function InamicGheata({
  id = "xeno",
  pozitie = [0, 2.2, 0],
  scara = 1,
  culoare = "#39f5ff",
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
  const texturaAlien = useLoader(THREE.TextureLoader, "/assets/inamic-gheata-mask.png");
  texturaAlien.colorSpace = THREE.SRGBColorSpace;
  texturaAlien.anisotropy = 16;

  const uniformeAlien = useMemo(
    () => ({
      uTexture: { value: texturaAlien },
      uOpacity: { value: 1 },
      uFlash: { value: 0 },
    }),
    [texturaAlien]
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
      startProiectil: new THREE.Vector3(),
      tintaProiectil: new THREE.Vector3(),
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
      const factorOrbita = Math.sin(clock.elapsedTime * 1.7 + stare.current.offset);

      if (distanta > DISTANTA_ORBITA) {
        obiect.position.addScaledVector(directie, VITEZA_INAMIC * delta);
      } else if (distanta < DISTANTA_ORBITA - 4) {
        obiect.position.addScaledVector(directie, -VITEZA_INAMIC * 0.7 * delta);
      }

      obiect.position.addScaledVector(lateral, factorOrbita * 2.1 * delta);
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
        stare.current.cooldown = 1.8 + Math.random() * 1.1;
      }
    } else {
      stare.current.modAgresiv = false;
      stare.current.modFuga = false;
      const timp = clock.elapsedTime * 0.28 + stare.current.offset;
      obiect.position.x = THREE.MathUtils.lerp(obiect.position.x, baza.x + Math.cos(timp) * 5.2, 0.025);
      obiect.position.z = THREE.MathUtils.lerp(obiect.position.z, baza.z + Math.sin(timp * 1.2) * 4.1, 0.025);
    }

    obiect.position.y = baza.y + Math.sin(clock.elapsedTime * 2.1 + stare.current.offset) * 0.28;

    if (sprite.current) {
      sprite.current.quaternion.copy(camera.quaternion);
      sprite.current.rotation.z -= stare.current.unghiVizual;
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
          scale={[3.4, 2.4, 1]}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        <mesh ref={sprite} scale={[3.1, 2.05, 1]}>
          <planeGeometry args={[1, 1]} />
          <shaderMaterial
            uniforms={uniformeAlien}
            vertexShader={vertexShaderAlien}
            fragmentShader={fragmentShaderAlien}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>

        {selectat && (
          <mesh ref={inel} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.05, 0]}>
            <ringGeometry args={[2.2, 2.45, 48]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
        )}

        <group ref={bara} position={[0, 1.85, 0]}>
          <mesh position={[0, 0.16, 0]}>
            <planeGeometry args={[1.6, 0.12]} />
            <meshBasicMaterial color="#021018" transparent opacity={0.55} depthWrite={false} />
          </mesh>
          <mesh position={[-0.8 + 0.8 * procentScut, 0.16, 0.001]} scale={[Math.max(procentScut, 0.0001), 1, 1]}>
            <planeGeometry args={[1.6, 0.09]} />
            <meshBasicMaterial color="#3ad9ff" transparent opacity={0.95} depthWrite={false} toneMapped={false} />
          </mesh>

          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[1.6, 0.12]} />
            <meshBasicMaterial color="#1a0a06" transparent opacity={0.55} depthWrite={false} />
          </mesh>
          <mesh position={[-0.8 + 0.8 * procentHp, 0, 0.001]} scale={[Math.max(procentHp, 0.0001), 1, 1]}>
            <planeGeometry args={[1.6, 0.09]} />
            <meshBasicMaterial color="#ff5a3c" transparent opacity={0.95} depthWrite={false} toneMapped={false} />
          </mesh>
        </group>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.18, 0]}>
          <ringGeometry args={[1.7, 1.95, 42]} />
          <meshBasicMaterial color={culoare} transparent opacity={0.32} side={THREE.DoubleSide} />
        </mesh>

        <pointLight color={culoare} intensity={4.2} distance={13} />
      </group>

      {proiectile.map((proiectil) => (
        <ProiectilAlien
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
