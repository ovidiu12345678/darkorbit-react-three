import { useFrame, useLoader } from "@react-three/fiber";
import { useCallback, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const CONFIGURATII = {
  arici: {
    textura: "assets/noctis-arici-carbonizat.png",
    dimensiune: [5.1, 5.1],
    culoare: "#ff6a24",
    viteza: 2.35,
    detectie: 31,
    atac: 17,
    orbita: 10,
    cooldown: 2.15,
    dauna: 9800,
    tipProiectil: "spini",
  },
  butoi: {
    textura: "assets/noctis-butoi-biomecanic.png",
    dimensiune: [4.8, 5.35],
    culoare: "#ff352a",
    viteza: 1.85,
    detectie: 34,
    atac: 19,
    orbita: 13,
    cooldown: 2.75,
    dauna: 19200,
    tipProiectil: "furnal",
  },
  stea: {
    textura: "assets/noctis-stea-moleculara.png",
    dimensiune: [5.8, 5.8],
    culoare: "#64eff0",
    viteza: 3.05,
    detectie: 37,
    atac: 22,
    orbita: 16,
    cooldown: 1.85,
    dauna: 14500,
    tipProiectil: "molecular",
  },
};

const PRAG_FUGA = 0.1;
const VITEZA_PROIECTIL = 34;
const RAZA_IMPACT = 1.7;

function punctFuga(marimeHarta) {
  const margine = (marimeHarta / 2 - 4.5) * 0.91;
  const liber = (Math.random() - 0.5) * margine * 1.7;
  const semn = Math.random() < 0.5 ? -1 : 1;
  return Math.random() < 0.5
    ? new THREE.Vector3(semn * margine, 0, liber)
    : new THREE.Vector3(liber, 0, semn * margine);
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uTextura;
  uniform float uTimp;
  uniform float uFlash;
  uniform float uTip;
  uniform vec3 uCuloare;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;

    if (uTip < 0.5) {
      vec2 centru = uv - 0.5;
      float raza = length(centru);
      float respiratie = sin(uTimp * 2.8) * 0.022;
      uv = 0.5 + centru * (1.0 + respiratie);
      uv += normalize(centru + vec2(0.0001)) * sin(raza * 32.0 - uTimp * 4.2) * 0.004;
    } else if (uTip < 1.5) {
      float pasMecanic = step(0.55, fract(uTimp * 1.7));
      uv.x += sin(floor(uv.y * 7.0) + uTimp * 4.0) * 0.0025 * pasMecanic;
      uv.y += sin(uTimp * 3.4) * 0.004;
    } else {
      vec2 centru = uv - 0.5;
      float raza = length(centru);
      vec2 unda = vec2(
        sin(uv.y * 15.0 + uTimp * 3.0),
        cos(uv.x * 14.0 - uTimp * 2.6)
      );
      uv += unda * 0.012 * smoothstep(0.12, 0.7, raza);
    }

    vec4 tex = texture2D(uTextura, uv);
    if (tex.a < 0.025) discard;

    float puls = 0.5 + 0.5 * sin(uTimp * (uTip < 1.5 ? 4.5 : 2.4));
    vec3 culoare = tex.rgb * (1.05 + puls * 0.08);
    culoare += uCuloare * pow(max(max(tex.r, tex.g), tex.b), 3.0) * 0.09;
    culoare = mix(culoare, vec3(1.0), clamp(uFlash, 0.0, 1.0) * 0.7);
    gl_FragColor = vec4(culoare, tex.a);
    #include <colorspace_fragment>
  }
`;

function ProiectilNoctis({ id, start, directie, configuratie, playerRef, onLovitura, onSterge }) {
  const grup = useRef();
  const viata = useRef(2.8);
  const eliminat = useRef(false);
  const vectorDirectie = useMemo(
    () => new THREE.Vector3(...directie).normalize(),
    [directie]
  );

  useFrame(({ clock }, deltaBrut) => {
    if (!grup.current || eliminat.current) return;
    const delta = Math.min(deltaBrut, 0.05);
    grup.current.position.addScaledVector(vectorDirectie, VITEZA_PROIECTIL * delta);
    grup.current.rotation.y += delta * (configuratie.tipProiectil === "molecular" ? 8 : 3.5);
    grup.current.rotation.z += delta * 5;
    const puls = 0.86 + Math.sin(clock.elapsedTime * 12) * 0.14;
    grup.current.scale.setScalar(puls);
    viata.current -= delta;

    if (grup.current.position.distanceTo(playerRef.current) < RAZA_IMPACT) {
      eliminat.current = true;
      onLovitura(configuratie.dauna);
      onSterge(id);
    } else if (viata.current <= 0) {
      eliminat.current = true;
      onSterge(id);
    }
  });

  const esteSpini = configuratie.tipProiectil === "spini";
  const esteMolecular = configuratie.tipProiectil === "molecular";

  return (
    <group ref={grup} position={start}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        {esteSpini ? (
          <coneGeometry args={[0.32, 1.15, 8]} />
        ) : esteMolecular ? (
          <torusKnotGeometry args={[0.32, 0.09, 32, 6]} />
        ) : (
          <dodecahedronGeometry args={[0.5, 0]} />
        )}
        <meshBasicMaterial
          color={configuratie.culoare}
          transparent
          opacity={0.94}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <pointLight color={configuratie.culoare} intensity={3.2} distance={9} />
    </group>
  );
}

export default function InamicNoctis({
  id,
  tipNoctis = "arici",
  pozitie = [0, 2.2, 0],
  scara = 1,
  playerRef,
  onLovitura,
  activ = true,
  selectat = false,
  impulsLovitura = 0,
  hp,
  scut,
  hpMax,
  scutMax,
  marimeHarta = 1260,
  onSelectare,
  onAtac,
  onPozitie,
}) {
  const configuratie = CONFIGURATII[tipNoctis] ?? CONFIGURATII.arici;
  const textura = useLoader(
    THREE.TextureLoader,
    `${import.meta.env.BASE_URL}${configuratie.textura}`
  );
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 16;

  const indiceTip = tipNoctis === "arici" ? 0 : tipNoctis === "butoi" ? 1 : 2;
  const uniforme = useMemo(
    () => ({
      uTextura: { value: textura },
      uTimp: { value: 0 },
      uFlash: { value: 0 },
      uTip: { value: indiceTip },
      uCuloare: { value: new THREE.Color(configuratie.culoare) },
    }),
    [textura, indiceTip, configuratie.culoare]
  );

  const inamic = useRef();
  const sprite = useRef();
  const bara = useRef();
  const inel = useRef();
  const detaliiVii = useRef();
  const ochiMobil = useRef();
  const molecule = useRef([]);
  const ultimulImpuls = useRef(impulsLovitura);
  const flashLovitura = useRef(0);
  const [proiectile, setProiectile] = useState([]);
  const stare = useRef({
    baza: new THREE.Vector3(...pozitie),
    offset: Math.random() * Math.PI * 2,
    cooldown: 0.8 + Math.random() * 1.3,
    unghi: 0,
    fuga: false,
    tintaFuga: null,
  });
  const temp = useMemo(
    () => ({ directie: new THREE.Vector3(), lateral: new THREE.Vector3() }),
    []
  );

  const stergeProiectil = useCallback((proiectilId) => {
    setProiectile((lista) => lista.filter((proiectil) => proiectil.id !== proiectilId));
  }, []);

  const selecteaza = useCallback((event) => {
    event.stopPropagation();
    onSelectare?.(id);
  }, [id, onSelectare]);

  const ataca = useCallback((event) => {
    event.stopPropagation();
    onAtac?.(id);
  }, [id, onAtac]);

  useFrame(({ camera, clock }, deltaBrut) => {
    if (!inamic.current || !playerRef?.current) return;
    const delta = Math.min(deltaBrut, 0.05);
    const obiect = inamic.current;
    const timp = clock.elapsedTime;
    const local = stare.current;

    if (impulsLovitura && impulsLovitura !== ultimulImpuls.current) {
      ultimulImpuls.current = impulsLovitura;
      flashLovitura.current = 1;
    }
    flashLovitura.current = Math.max(0, flashLovitura.current - delta * 3);
    local.cooldown -= delta;
    onPozitie?.(id, obiect.position);

    const catreJucator = temp.directie.set(
      playerRef.current.x - obiect.position.x,
      0,
      playerRef.current.z - obiect.position.z
    );
    const distanta = catreJucator.length();
    const inPragFuga = hp <= hpMax * PRAG_FUGA && scut <= scutMax * PRAG_FUGA;

    if (inPragFuga) {
      local.fuga = true;
      if (!local.tintaFuga || obiect.position.distanceTo(local.tintaFuga) < 6) {
        local.tintaFuga = punctFuga(marimeHarta);
      }
      catreJucator.copy(local.tintaFuga).sub(obiect.position).setY(0).normalize();
      obiect.position.addScaledVector(catreJucator, configuratie.viteza * 1.6 * delta);
      local.unghi = Math.atan2(catreJucator.x, catreJucator.z);
    } else if (distanta < configuratie.detectie) {
      local.fuga = false;
      catreJucator.normalize();
      const lateral = temp.lateral.set(-catreJucator.z, 0, catreJucator.x);
      let factorViteza = 1;
      let balans = 0;

      if (tipNoctis === "arici") {
        factorViteza = 0.45 + Math.max(0, Math.sin(timp * 2.7 + local.offset)) * 1.45;
        balans = Math.sin(timp * 1.7 + local.offset) * 1.7;
      } else if (tipNoctis === "butoi") {
        factorViteza = Math.sin(timp * 3.2 + local.offset) > 0.05 ? 1.45 : 0.18;
        balans = Math.sin(timp * 3.2 + local.offset) * 0.9;
      } else {
        factorViteza = 0.88 + Math.sin(timp * 1.4 + local.offset) * 0.24;
        balans = Math.sin(timp * 1.15 + local.offset) * 4.1;
      }

      if (distanta > configuratie.orbita) {
        obiect.position.addScaledVector(catreJucator, configuratie.viteza * factorViteza * delta);
      } else if (distanta < configuratie.orbita - 4) {
        obiect.position.addScaledVector(catreJucator, -configuratie.viteza * 0.65 * delta);
      }
      obiect.position.addScaledVector(lateral, balans * delta);
      local.unghi = THREE.MathUtils.lerp(local.unghi, Math.atan2(catreJucator.x, catreJucator.z), 0.12);

      if (distanta < configuratie.atac && local.cooldown <= 0) {
        const start = obiect.position.clone().add(new THREE.Vector3(0, 0.15, 0));
        const directie = playerRef.current.clone().sub(start).normalize();
        setProiectile((lista) => [...lista.slice(-8), {
          id: `${id}-${timp.toFixed(3)}-${Math.random().toString(16).slice(2)}`,
          start: start.toArray(),
          directie: directie.toArray(),
        }]);
        local.cooldown = configuratie.cooldown + Math.random() * 0.7;
      }
    } else {
      const baza = local.baza;
      if (tipNoctis === "arici") {
        obiect.position.x = THREE.MathUtils.lerp(obiect.position.x, baza.x + Math.cos(timp * 0.36 + local.offset) * 8, 0.022);
        obiect.position.z = THREE.MathUtils.lerp(obiect.position.z, baza.z + Math.sin(timp * 0.48 + local.offset) * 8, 0.022);
      } else if (tipNoctis === "butoi") {
        const pas = Math.floor(timp * 0.72 + local.offset) * 1.45;
        obiect.position.x = THREE.MathUtils.lerp(obiect.position.x, baza.x + Math.cos(pas) * 6, 0.04);
        obiect.position.z = THREE.MathUtils.lerp(obiect.position.z, baza.z + Math.sin(pas) * 5, 0.04);
      } else {
        obiect.position.x = THREE.MathUtils.lerp(obiect.position.x, baza.x + Math.cos(timp * 0.28 + local.offset) * 12, 0.02);
        obiect.position.z = THREE.MathUtils.lerp(obiect.position.z, baza.z + Math.sin(timp * 0.41 + local.offset) * 9, 0.02);
      }
    }

    const plutire = tipNoctis === "arici"
      ? Math.sin(timp * 2.2 + local.offset) * 0.22
      : tipNoctis === "butoi"
        ? Math.abs(Math.sin(timp * 3.2 + local.offset)) * 0.18
        : Math.sin(timp * 1.15 + local.offset) * 0.58;
    obiect.position.y = local.baza.y + plutire;

    if (sprite.current) {
      sprite.current.quaternion.copy(camera.quaternion);
      sprite.current.rotation.z -= local.unghi + (tipNoctis === "stea" ? Math.sin(timp * 0.7 + local.offset) * 0.16 : 0);
      const puls = tipNoctis === "arici"
        ? 1 + Math.sin(timp * 2.8 + local.offset) * 0.055
        : tipNoctis === "butoi"
          ? 1 + Math.sin(timp * 3.2 + local.offset) * 0.035
          : 1 + Math.sin(timp * 1.9 + local.offset) * 0.045;
      sprite.current.scale.set(
        configuratie.dimensiune[0] * puls,
        configuratie.dimensiune[1] * (tipNoctis === "arici" ? puls : 2 - puls),
        1
      );
      sprite.current.material.uniforms.uTimp.value = timp;
      sprite.current.material.uniforms.uFlash.value = flashLovitura.current;
    }

    if (detaliiVii.current) {
      detaliiVii.current.quaternion.copy(camera.quaternion);
      detaliiVii.current.rotation.z = -local.unghi + Math.sin(timp * 0.8 + local.offset) * 0.12;
    }
    if (ochiMobil.current) {
      ochiMobil.current.position.x = Math.sin(timp * 1.9 + local.offset) * 0.16;
      ochiMobil.current.position.y = Math.cos(timp * 1.45 + local.offset) * 0.12;
      ochiMobil.current.scale.y = 0.72 + Math.abs(Math.sin(timp * 2.35 + local.offset)) * 0.28;
    }
    molecule.current.forEach((nod, index) => {
      if (!nod) return;
      const unghi = timp * (0.65 + index * 0.08) + local.offset + index;
      nod.position.x = Math.cos(unghi) * (0.48 + (index % 3) * 0.32);
      nod.position.y = Math.sin(unghi * 1.3) * (0.42 + (index % 2) * 0.35);
      nod.scale.setScalar(0.75 + Math.sin(timp * 2.4 + index) * 0.22);
    });

    if (inel.current) inel.current.rotation.z += delta * (tipNoctis === "stea" ? 1.35 : 0.62);
    if (bara.current) bara.current.quaternion.copy(camera.quaternion);
  });

  if (!activ) return null;

  const procentHp = THREE.MathUtils.clamp(hp / hpMax, 0, 1);
  const procentScut = THREE.MathUtils.clamp(scut / scutMax, 0, 1);

  return (
    <>
      <group ref={inamic} position={pozitie} scale={scara}>
        <mesh onPointerDown={selecteaza} onDoubleClick={ataca} visible={false} scale={[5.8, 5.2, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        <mesh ref={sprite} scale={[...configuratie.dimensiune, 1]} renderOrder={12}>
          <planeGeometry args={[1, 1]} />
          <shaderMaterial
            uniforms={uniforme}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>

        {tipNoctis === "stea" && (
          <group ref={detaliiVii} position={[0, 0, 0.08]} renderOrder={13}>
            <mesh ref={ochiMobil}>
              <circleGeometry args={[0.22, 32]} />
              <meshBasicMaterial color="#5b0906" transparent opacity={0.72} depthWrite={false} toneMapped={false} />
            </mesh>
            {Array.from({ length: 7 }, (_, index) => (
              <mesh
                key={index}
                ref={(nod) => {
                  molecule.current[index] = nod;
                }}
              >
                <circleGeometry args={[index % 2 === 0 ? 0.075 : 0.05, 16]} />
                <meshBasicMaterial
                  color={index % 2 === 0 ? "#66f6f1" : "#ffd36a"}
                  transparent
                  opacity={0.72}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                  toneMapped={false}
                />
              </mesh>
            ))}
          </group>
        )}

        <mesh ref={inel} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.25, 0]}>
          <ringGeometry args={[2.5, 2.72, 48]} />
          <meshBasicMaterial
            color={configuratie.culoare}
            transparent
            opacity={selectat ? 0.82 : 0.22}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        <group ref={bara} position={[0, 2.55, 0]}>
          <mesh position={[0, 0.16, 0]}>
            <planeGeometry args={[2.2, 0.14]} />
            <meshBasicMaterial color="#031018" transparent opacity={0.76} depthWrite={false} />
          </mesh>
          <mesh position={[-1.1 + 1.1 * procentScut, 0.16, 0.002]} scale={[Math.max(procentScut, 0.0001), 1, 1]}>
            <planeGeometry args={[2.2, 0.1]} />
            <meshBasicMaterial color="#45dbff" toneMapped={false} />
          </mesh>
          <mesh>
            <planeGeometry args={[2.2, 0.14]} />
            <meshBasicMaterial color="#180606" transparent opacity={0.76} depthWrite={false} />
          </mesh>
          <mesh position={[-1.1 + 1.1 * procentHp, 0, 0.002]} scale={[Math.max(procentHp, 0.0001), 1, 1]}>
            <planeGeometry args={[2.2, 0.1]} />
            <meshBasicMaterial color="#ff5945" toneMapped={false} />
          </mesh>
        </group>
        <pointLight color={configuratie.culoare} intensity={3.8} distance={15} />
      </group>

      {proiectile.map((proiectil) => (
        <ProiectilNoctis
          key={proiectil.id}
          {...proiectil}
          configuratie={configuratie}
          playerRef={playerRef}
          onLovitura={onLovitura}
          onSterge={stergeProiectil}
        />
      ))}
    </>
  );
}
