import { useFrame, useLoader } from "@react-three/fiber";
import { useCallback, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const CONFIGURATII = {
  manta: {
    textura: "assets/aether-alloy-petal-manta.png",
    dimensiune: [5.2, 4.32],
    culoare: "#7cecff",
    viteza: 2.5,
    detectie: 29,
    atac: 18,
    orbita: 12,
    cooldown: 2.4,
    dauna: 7600,
    tipProiectil: "unda",
  },
  oculus: {
    textura: "assets/aether-oculus-ravager.png",
    dimensiune: [5.5, 3.81],
    culoare: "#ff593d",
    viteza: 3.25,
    detectie: 32,
    atac: 17,
    orbita: 9,
    cooldown: 1.55,
    dauna: 13800,
    tipProiectil: "ochi",
  },
  chronolith: {
    textura: "assets/aether-chronolith-sentinel.png",
    dimensiune: [4.7, 4.7],
    culoare: "#8dff88",
    viteza: 2.05,
    detectie: 36,
    atac: 22,
    orbita: 15,
    cooldown: 2.9,
    dauna: 21500,
    tipProiectil: "timp",
  },
};

const PRAG_FUGA = 0.1;
const VITEZA_PROIECTIL = 34;
const RAZA_IMPACT = 1.7;
const RAZA_RENUNTARE = 48;

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
      float aripa = abs(uv.x - 0.5) * 2.0;
      uv.y += sin(uv.x * 12.0 + uTimp * 3.0) * 0.014 * aripa;
    } else if (uTip < 1.5) {
      vec2 centru = uv - 0.5;
      uv = 0.5 + centru * (1.0 + sin(uTimp * 5.2) * 0.012);
    } else {
      float pas = floor(mod(uTimp * 5.0, 4.0));
      uv.x += (pas - 1.5) * 0.0016;
      uv.y += sin(uTimp * 2.2 + uv.x * 9.0) * 0.003;
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

function ProiectilAether({ id, start, directie, configuratie, playerRef, onLovitura, onSterge, zonaSiguraJucator, provocat }) {
  const grup = useRef();
  const viata = useRef(2.8);
  const eliminat = useRef(false);
  const vectorDirectie = useMemo(
    () => new THREE.Vector3(...directie).normalize(),
    [directie]
  );

  useFrame(({ clock }, deltaBrut) => {
    if (!grup.current || eliminat.current) return;
    if (zonaSiguraJucator && !provocat) {
      eliminat.current = true;
      onSterge(id);
      return;
    }
    const delta = Math.min(deltaBrut, 0.05);
    grup.current.position.addScaledVector(vectorDirectie, VITEZA_PROIECTIL * delta);
    grup.current.rotation.y += delta * (configuratie.tipProiectil === "timp" ? 8 : 3.5);
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

  const esteUnda = configuratie.tipProiectil === "unda";
  const esteTimp = configuratie.tipProiectil === "timp";

  return (
    <group ref={grup} position={start}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        {esteUnda ? (
          <ringGeometry args={[0.38, 0.72, 32]} />
        ) : esteTimp ? (
          <octahedronGeometry args={[0.55, 0]} />
        ) : (
          <sphereGeometry args={[0.48, 16, 12]} />
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

export default function InamicAether({
  id,
  tipAether = "manta",
  pozitie = [0, 2.2, 0],
  scara = 1,
  playerRef,
  onLovitura,
  activ = true,
  selectat = false,
  impulsLovitura = 0,
  provocat = false,
  zonaSiguraJucator = false,
  hp,
  scut,
  hpMax,
  scutMax,
  marimeHarta = 1260,
  onSelectare,
  onAtac,
  onPozitie,
  onRenuntaAgresivitate,
}) {
  const configuratie = CONFIGURATII[tipAether] ?? CONFIGURATII.manta;
  const textura = useLoader(
    THREE.TextureLoader,
    `${import.meta.env.BASE_URL}${configuratie.textura}`
  );
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 16;

  const indiceTip = tipAether === "manta" ? 0 : tipAether === "oculus" ? 1 : 2;
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
    const distantaDeBaza = obiect.position.distanceTo(local.baza);
    const depasesteRenuntarea = provocat && !inPragFuga && distantaDeBaza > RAZA_RENUNTARE;
    if (depasesteRenuntarea) {
      onRenuntaAgresivitate?.(id);
    }
    const provocatEfectiv = provocat && !depasesteRenuntarea;

    if (inPragFuga && provocat) {
      local.fuga = true;
      if (!local.tintaFuga || obiect.position.distanceTo(local.tintaFuga) < 6) {
        local.tintaFuga = punctFuga(marimeHarta);
      }
      catreJucator.copy(local.tintaFuga).sub(obiect.position).setY(0).normalize();
      obiect.position.addScaledVector(catreJucator, configuratie.viteza * 1.6 * delta);
      local.unghi = Math.atan2(catreJucator.x, catreJucator.z);
    } else if (provocatEfectiv) {
      local.fuga = false;
      catreJucator.normalize();
      const lateral = temp.lateral.set(-catreJucator.z, 0, catreJucator.x);
      let factorViteza = 1;
      let balans = 0;

      if (tipAether === "manta") {
        factorViteza = 0.82 + Math.sin(timp * 2.1 + local.offset) * 0.18;
        balans = Math.sin(timp * 1.35 + local.offset) * 2.8;
      } else if (tipAether === "oculus") {
        factorViteza = 1 + Math.max(0, Math.sin(timp * 3.2 + local.offset)) * 1.5;
        balans = Math.sin(timp * 4.8 + local.offset) * 4.2;
      } else {
        factorViteza = Math.sin(timp * 4.0 + local.offset) > 0.28 ? 1.7 : 0.28;
        balans = Math.sin(timp * 0.9 + local.offset) * 1.5;
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
      if (tipAether === "manta") {
        obiect.position.x = THREE.MathUtils.lerp(obiect.position.x, baza.x + Math.cos(timp * 0.23 + local.offset) * 10, 0.018);
        obiect.position.z = THREE.MathUtils.lerp(obiect.position.z, baza.z + Math.sin(timp * 0.31 + local.offset) * 7, 0.018);
      } else if (tipAether === "oculus") {
        obiect.position.x = THREE.MathUtils.lerp(obiect.position.x, baza.x + Math.sin(timp * 0.55 + local.offset) * 7, 0.035);
        obiect.position.z = THREE.MathUtils.lerp(obiect.position.z, baza.z + Math.sin(timp * 1.1 + local.offset) * 5, 0.035);
      } else {
        const pas = Math.floor(timp * 0.55 + local.offset) * 1.7;
        obiect.position.x = THREE.MathUtils.lerp(obiect.position.x, baza.x + Math.cos(pas) * 8, 0.045);
        obiect.position.z = THREE.MathUtils.lerp(obiect.position.z, baza.z + Math.sin(pas) * 8, 0.045);
      }
    }

    const plutire = tipAether === "manta"
      ? Math.sin(timp * 1.6 + local.offset) * 0.5
      : tipAether === "oculus"
        ? Math.sin(timp * 3.8 + local.offset) * 0.25
        : Math.sin(timp * 1.05 + local.offset) * 0.16;
    obiect.position.y = local.baza.y + plutire;

    if (sprite.current) {
      sprite.current.quaternion.copy(camera.quaternion);
      sprite.current.rotation.z -= local.unghi;
      const puls = tipAether === "oculus" ? 1 + Math.sin(timp * 5 + local.offset) * 0.035 : 1;
      sprite.current.scale.set(
        configuratie.dimensiune[0] * puls,
        configuratie.dimensiune[1] / puls,
        1
      );
      sprite.current.material.uniforms.uTimp.value = timp;
      sprite.current.material.uniforms.uFlash.value = flashLovitura.current;
    }

    if (inel.current) inel.current.rotation.z += delta * (tipAether === "chronolith" ? 1.8 : 0.7);
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
        <ProiectilAether
          key={proiectil.id}
          {...proiectil}
          configuratie={configuratie}
          playerRef={playerRef}
          onLovitura={onLovitura}
          onSterge={stergeProiectil}
          zonaSiguraJucator={zonaSiguraJucator}
          provocat={provocat}
        />
      ))}
    </>
  );
}
