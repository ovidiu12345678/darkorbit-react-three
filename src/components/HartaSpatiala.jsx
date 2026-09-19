import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CORPURI_KHARON } from "../corpuriKharon.js";
import { CORPURI_FLOTA } from "../corpuriFlota.js";
import { CORPURI_VERDANT } from "../corpuriVerdant.js";
import { CORPURI_NERIDIA } from "../corpuriNeridia.js";
import { CORPURI_FRONTIERA_15 } from "../corpuriFrontiera15.js";
import { CORPURI_FRONTIERA_16 } from "../corpuriFrontiera16.js";
import { CORPURI_FRONTIERA_17 } from "../corpuriFrontiera17.js";
import { CORPURI_FRONTIERA_18 } from "../corpuriFrontiera18.js";
import { SECTOARE_NOI } from "../sectoareNoi.js";
import ZonaPirata from "./ZonaPirata.jsx";

let contextSunetPortal = null;
let volumPortalAnterior = null;

async function redaSunetPortal(tema = "aether") {
  if (typeof window === "undefined") return;
  const AudioContextClasa = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClasa) return;

  contextSunetPortal ??= new AudioContextClasa();
  if (contextSunetPortal.state === "suspended") {
    await contextSunetPortal.resume();
  }

  const context = contextSunetPortal;
  const acum = context.currentTime;
  const esteNoctis = tema === "noctis";
  const esteKharon = tema === "kharon" || tema === "flota" || tema === "verdant" || tema === "neridia" || tema === "frontiera15" || tema === "frontiera16" || tema === "frontiera17" || tema === "frontiera18" || Boolean(SECTOARE_NOI[tema]);
  const frecventaRezonantei = esteKharon ? 86 : esteNoctis ? 118 : 154;

  if (volumPortalAnterior) {
    volumPortalAnterior.gain.cancelScheduledValues(acum);
    volumPortalAnterior.gain.setTargetAtTime(0.0001, acum, 0.045);
  }

  const master = context.createGain();
  volumPortalAnterior = master;
  const compresor = context.createDynamicsCompressor();
  const limitator = context.createWaveShaper();
  const iesire = context.createGain();
  const curbaLimitator = new Float32Array(1024);
  for (let index = 0; index < curbaLimitator.length; index += 1) {
    const valoare = (index / (curbaLimitator.length - 1)) * 2 - 1;
    curbaLimitator[index] = Math.tanh(valoare * 1.7) / Math.tanh(1.7);
  }
  limitator.curve = curbaLimitator;
  limitator.oversample = "2x";
  compresor.threshold.setValueAtTime(-21, acum);
  compresor.knee.setValueAtTime(7, acum);
  compresor.ratio.setValueAtTime(9, acum);
  compresor.attack.setValueAtTime(0.003, acum);
  compresor.release.setValueAtTime(0.27, acum);
  iesire.gain.setValueAtTime(0.92, acum);
  master.gain.setValueAtTime(0.0001, acum);
  master.gain.exponentialRampToValueAtTime(0.48, acum + 0.12);
  master.gain.exponentialRampToValueAtTime(0.72, acum + 1.78);
  master.gain.exponentialRampToValueAtTime(1, acum + 2.04);
  master.gain.exponentialRampToValueAtTime(0.64, acum + 2.75);
  master.gain.exponentialRampToValueAtTime(0.0001, acum + 4.35);
  master.connect(compresor);
  compresor.connect(limitator);
  limitator.connect(iesire);
  iesire.connect(context.destination);

  const pornesteOscilator = (tip, frecvente, volum, panorama) => {
    const oscilator = context.createOscillator();
    const castig = context.createGain();
    const panner = typeof context.createStereoPanner === "function"
      ? context.createStereoPanner()
      : null;

    oscilator.type = tip;
    oscilator.frequency.setValueAtTime(frecvente[0], acum);
    oscilator.frequency.exponentialRampToValueAtTime(frecvente[1], acum + 1.92);
    oscilator.frequency.exponentialRampToValueAtTime(frecvente[2], acum + 4.14);
    castig.gain.setValueAtTime(0.0001, acum);
    castig.gain.exponentialRampToValueAtTime(volum, acum + 0.14);
    castig.gain.exponentialRampToValueAtTime(volum * 0.74, acum + 2.25);
    castig.gain.exponentialRampToValueAtTime(0.0001, acum + 4.2);

    oscilator.connect(castig);
    if (panner) {
      panner.pan.setValueAtTime(panorama, acum);
      panner.pan.linearRampToValueAtTime(-panorama, acum + 4.1);
      castig.connect(panner);
      panner.connect(master);
    } else {
      castig.connect(master);
    }

    oscilator.start(acum);
    oscilator.stop(acum + 4.25);
  };

  pornesteOscilator(
    "sine",
    esteKharon ? [38, 220, 48] : esteNoctis ? [52, 280, 74] : [78, 430, 108],
    esteKharon ? 0.82 : esteNoctis ? 0.76 : 0.71,
    -0.32
  );
  pornesteOscilator(
    "triangle",
    esteKharon ? [118, 510, 92] : esteNoctis ? [165, 640, 130] : [238, 920, 190],
    esteKharon ? 0.43 : esteNoctis ? 0.38 : 0.34,
    0.38
  );

  const impact = context.createOscillator();
  const castigImpact = context.createGain();
  impact.type = "sine";
  impact.frequency.setValueAtTime(esteKharon ? 70 : esteNoctis ? 88 : 112, acum + 1.9);
  impact.frequency.exponentialRampToValueAtTime(esteKharon ? 25 : esteNoctis ? 32 : 42, acum + 3.05);
  castigImpact.gain.setValueAtTime(0.0001, acum + 1.89);
  castigImpact.gain.exponentialRampToValueAtTime(esteKharon ? 1.2 : esteNoctis ? 1.08 : 0.98, acum + 2.04);
  castigImpact.gain.exponentialRampToValueAtTime(0.0001, acum + 3.2);
  impact.connect(castigImpact);
  castigImpact.connect(master);
  impact.start(acum + 1.89);
  impact.stop(acum + 3.25);

  const rezonanta = context.createGain();
  rezonanta.gain.setValueAtTime(0.82, acum);
  rezonanta.connect(master);
  [[0.16, 0.34], [0.39, 0.2], [0.68, 0.11]].forEach(([decalaj, nivel]) => {
    const ecou = context.createDelay(0.8);
    const volumEcou = context.createGain();
    ecou.delayTime.setValueAtTime(decalaj, acum);
    volumEcou.gain.setValueAtTime(nivel, acum);
    rezonanta.connect(ecou);
    ecou.connect(volumEcou);
    volumEcou.connect(master);
  });

  [
    [1, 0.48, -0.55],
    [1.5, 0.25, 0.42],
    [2.01, 0.18, -0.22],
    [3.02, 0.1, 0.58],
  ].forEach(([armonica, volum, panorama], index) => {
    const oscilator = context.createOscillator();
    const castig = context.createGain();
    const panner = typeof context.createStereoPanner === "function"
      ? context.createStereoPanner()
      : null;
    oscilator.type = index === 2 ? "triangle" : "sine";
    oscilator.frequency.setValueAtTime(frecventaRezonantei * armonica * 1.055, acum + 1.86);
    oscilator.frequency.exponentialRampToValueAtTime(frecventaRezonantei * armonica * 0.92, acum + 4.3);
    castig.gain.setValueAtTime(0.0001, acum + 1.86);
    castig.gain.exponentialRampToValueAtTime(volum, acum + 2.04);
    castig.gain.exponentialRampToValueAtTime(volum * 0.38, acum + 2.75);
    castig.gain.exponentialRampToValueAtTime(0.0001, acum + 4.3);
    oscilator.connect(castig);
    if (panner) {
      panner.pan.setValueAtTime(panorama, acum + 1.86);
      panner.pan.linearRampToValueAtTime(-panorama, acum + 4.2);
      castig.connect(panner);
      panner.connect(rezonanta);
    } else {
      castig.connect(rezonanta);
    }
    oscilator.start(acum + 1.86);
    oscilator.stop(acum + 4.35);
  });

  const durataZgomot = 1.7;
  const buffer = context.createBuffer(2, Math.ceil(context.sampleRate * durataZgomot), context.sampleRate);
  for (let canal = 0; canal < buffer.numberOfChannels; canal += 1) {
    const date = buffer.getChannelData(canal);
    let precedent = 0;
    for (let index = 0; index < date.length; index += 1) {
      const alb = Math.random() * 2 - 1;
      precedent = precedent * 0.75 + alb * 0.25;
      date[index] = precedent;
    }
  }

  const zgomot = context.createBufferSource();
  const filtru = context.createBiquadFilter();
  const castigZgomot = context.createGain();
  zgomot.buffer = buffer;
  filtru.type = "bandpass";
  filtru.Q.setValueAtTime(1.15, acum + 1.75);
  filtru.frequency.setValueAtTime(esteKharon ? 280 : esteNoctis ? 390 : 540, acum + 1.75);
  filtru.frequency.exponentialRampToValueAtTime(esteKharon ? 2200 : esteNoctis ? 2800 : 3400, acum + 2.04);
  filtru.frequency.exponentialRampToValueAtTime(esteKharon ? 420 : esteNoctis ? 560 : 720, acum + 3.34);
  castigZgomot.gain.setValueAtTime(0.0001, acum + 1.74);
  castigZgomot.gain.exponentialRampToValueAtTime(esteKharon ? 0.72 : esteNoctis ? 0.66 : 0.6, acum + 2.04);
  castigZgomot.gain.exponentialRampToValueAtTime(0.0001, acum + 3.36);
  zgomot.connect(filtru);
  filtru.connect(castigZgomot);
  castigZgomot.connect(master);
  zgomot.start(acum + 1.74);
  zgomot.stop(acum + 3.4);

  window.setTimeout(() => {
    if (volumPortalAnterior === master) volumPortalAnterior = null;
    master.disconnect();
    compresor.disconnect();
    limitator.disconnect();
    iesire.disconnect();
  }, 5600);
}

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

function PortalAether({
  pozitie,
  onTransport,
  imagine = "assets/portal-aether-helix.png",
  tema = "aether",
  semnalTransport = 0,
  onPornireTransport,
}) {
  const portal = useRef();
  const materialPortal = useRef();
  const insigna = useRef();
  const inelInsigna = useRef();
  const efectTransport = useRef();
  const coloanaEnergie = useRef();
  const undaSol = useRef();
  const undaAer = useRef();
  const flashCentral = useRef();
  const luminaTransport = useRef();
  const particule = useRef([]);
  const efectPornit = useRef(false);
  const timpEfect = useRef(0);
  const transportExecutat = useRef(false);
  const ultimulSemnalTransport = useRef(semnalTransport);
  const texturaPortal = useLoader(
    THREE.TextureLoader,
    `${import.meta.env.BASE_URL}${imagine}`
  );
  const esteNoctis = tema === "noctis";
  const esteKharon = tema === "kharon";
  const esteFlota = tema === "flota";
  const esteVerdant = tema === "verdant";
  const esteNeridia = tema === "neridia";
  const esteFrontiera15 = tema === "frontiera15";
  const esteFrontiera16 = tema === "frontiera16";
  const esteFrontiera17 = tema === "frontiera17";
  const esteFrontiera18 = tema === "frontiera18";
  const sectorNou = SECTOARE_NOI[tema];
  const culoareEnergie = sectorNou?.culoare ?? (esteFrontiera18 ? "#ff285a" : esteFrontiera17 ? "#ffc24f" : esteFrontiera16 ? "#ff462e" : esteFrontiera15 ? "#527eff" : esteNeridia ? "#54f88c" : esteVerdant ? "#ff3c25" : esteFlota ? "#ff4828" : esteKharon ? "#ff1818" : esteNoctis ? "#ff5b1f" : "#52dcff");
  const culoareAccent = sectorNou?.accent ?? (esteFrontiera18 ? "#f8c685" : esteFrontiera17 ? "#d9956d" : esteFrontiera16 ? "#e3a26b" : esteFrontiera15 ? "#d49365" : esteNeridia ? "#b5ffd2" : esteVerdant ? "#50ff8b" : esteFlota ? "#ffad58" : esteKharon ? "#7c0010" : esteNoctis ? "#ffc04a" : "#a66cff");
  const culoareRece = sectorNou?.rece ?? (esteFrontiera18 ? "#7751b7" : esteFrontiera17 ? "#7366a0" : esteFrontiera16 ? "#a42454" : esteFrontiera15 ? "#9b6fff" : esteNeridia ? "#008d77" : esteVerdant ? "#0d875a" : esteFlota ? "#a41520" : esteKharon ? "#ff5a28" : esteNoctis ? "#56e9ef" : "#71efff");

  const dateParticule = useMemo(
    () =>
      Array.from({ length: 16 }, (_, index) => {
        const unghi = (index / 16) * Math.PI * 2;
        const raza = 7 + (index % 4) * 1.45;

        return {
          x: Math.cos(unghi) * raza,
          z: Math.sin(unghi) * raza,
          decalaj: index / 16,
          viteza: 0.82 + (index % 3) * 0.16,
        };
      }),
    []
  );

  texturaPortal.colorSpace = THREE.SRGBColorSpace;
  texturaPortal.generateMipmaps = true;
  texturaPortal.minFilter = THREE.LinearMipmapLinearFilter;
  texturaPortal.magFilter = THREE.LinearFilter;

  useFrame(({ camera, clock }, delta) => {
    if (!portal.current) return;

    portal.current.quaternion.copy(camera.quaternion);
    portal.current.position.y = 9.4 + Math.sin(clock.elapsedTime * 1.35) * 0.55;

    if (insigna.current) {
      insigna.current.quaternion.copy(camera.quaternion);
      insigna.current.position.y = 37 + Math.sin(clock.elapsedTime * 1.8) * 0.75;
    }

    if (inelInsigna.current) {
      inelInsigna.current.rotation.z = clock.elapsedTime * 0.8;
      const pulsInsigna = 1 + Math.sin(clock.elapsedTime * 3.2) * 0.055;
      inelInsigna.current.scale.setScalar(pulsInsigna);
    }

    let intensitateTransport = 0;

    if (efectPornit.current) {
      timpEfect.current += delta;
      const progres = Math.min(timpEfect.current / 2.8, 1);
      const aparitie = Math.min(progres / 0.12, 1);
      const disparitie = 1 - Math.max(0, (progres - 0.68) / 0.32);
      intensitateTransport = aparitie * disparitie;

      if (efectTransport.current) efectTransport.current.visible = true;

      if (coloanaEnergie.current) {
        coloanaEnergie.current.scale.set(
          0.7 + progres * 0.65,
          0.3 + progres * 1.15,
          0.7 + progres * 0.65
        );
        coloanaEnergie.current.rotation.y = clock.elapsedTime * 2.4;
        coloanaEnergie.current.material.opacity = 0.34 * intensitateTransport;
      }

      if (undaSol.current) {
        const scaraSol = 0.65 + progres * 2.8;
        undaSol.current.scale.setScalar(scaraSol);
        undaSol.current.rotation.z = -clock.elapsedTime * 1.7;
        undaSol.current.material.opacity = (1 - progres) * 0.86;
      }

      if (undaAer.current) {
        undaAer.current.quaternion.copy(camera.quaternion);
        const scaraAer = 0.55 + progres * 2.35;
        undaAer.current.scale.setScalar(scaraAer);
        undaAer.current.material.opacity = (1 - progres) * 0.72;
      }

      if (flashCentral.current) {
        const scaraFlash = 0.8 + Math.sin(Math.min(1, progres * 1.7) * Math.PI) * 1.25;
        flashCentral.current.quaternion.copy(camera.quaternion);
        flashCentral.current.scale.setScalar(scaraFlash);
        flashCentral.current.material.opacity = intensitateTransport * 0.42;
      }

      particule.current.forEach((particula, index) => {
        if (!particula) return;
        const date = dateParticule[index];
        const progresParticula = (progres * date.viteza * 1.6 + date.decalaj) % 1;
        const apropiere = 1 - progresParticula * 0.52;

        particula.position.set(
          date.x * apropiere,
          1.5 + progresParticula * 34,
          date.z * apropiere
        );
        particula.rotation.y = clock.elapsedTime * 3 + index;
        particula.scale.setScalar(0.45 + Math.sin(progresParticula * Math.PI) * 0.85);
        particula.material.opacity = intensitateTransport * (1 - progresParticula) * 0.92;
      });

      if (luminaTransport.current) {
        luminaTransport.current.intensity = 5 + intensitateTransport * 18;
      }

      if (progres >= 0.72 && !transportExecutat.current) {
        transportExecutat.current = true;
        onTransport?.();
      }

      if (progres >= 1) {
        efectPornit.current = false;
        timpEfect.current = 0;
        intensitateTransport = 0;
        if (efectTransport.current) efectTransport.current.visible = false;
        if (luminaTransport.current) luminaTransport.current.intensity = 0;
      }
    }

    const puls = (40 + Math.sin(clock.elapsedTime * 2.1) * 0.7) * (1 + intensitateTransport * 0.1);
    portal.current.scale.set(puls, puls, 1);

    if (materialPortal.current) {
      materialPortal.current.color.setRGB(
        1 - intensitateTransport * 0.16,
        1,
        1
      );
    }
  });

  const activeazaTransportul = () => {
    if (efectPornit.current) return;
    timpEfect.current = 0;
    efectPornit.current = true;
    transportExecutat.current = false;
    if (efectTransport.current) efectTransport.current.visible = true;
    onPornireTransport?.();
    void redaSunetPortal(tema);
  };

  useEffect(() => {
    if (semnalTransport === ultimulSemnalTransport.current) return;
    ultimulSemnalTransport.current = semnalTransport;
    if (semnalTransport > 0) activeazaTransportul();
  }, [semnalTransport]);

  const pornesteTransportul = (eveniment) => {
    eveniment.stopPropagation();
    activeazaTransportul();
  };

  const seteazaCursorPortal = (valoare) => {
    document.body.style.cursor = valoare;
  };

  return (
    <group position={pozitie} scale={0.896}>
      <mesh ref={portal} position={[0, 9.4, 0]} renderOrder={3}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={materialPortal}
          map={texturaPortal}
          transparent
          alphaTest={0.025}
          depthWrite={false}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
        <ringGeometry args={[13.5, 15.2, 72]} />
        <meshBasicMaterial color={esteNeridia ? "#33da85" : esteVerdant ? "#40e879" : esteFlota ? "#ff5a32" : esteKharon ? "#b80012" : esteNoctis ? "#ff5b1f" : "#6d5cff"} transparent opacity={0.34} side={THREE.DoubleSide} />
      </mesh>

      <group ref={insigna} position={[0, 37, 0]} renderOrder={8}>
        <mesh
          onPointerDown={(eveniment) => eveniment.stopPropagation()}
          onClick={pornesteTransportul}
          onPointerOver={() => seteazaCursorPortal("pointer")}
          onPointerOut={() => seteazaCursorPortal("default")}
        >
          <circleGeometry args={[5.6, 64]} />
          <meshBasicMaterial
            map={texturaPortal}
            transparent
            alphaTest={0.025}
            depthWrite={false}
            depthTest={false}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>

        <mesh ref={inelInsigna} position={[0, 0, -0.05]}>
          <ringGeometry args={[6.05, 6.72, 64]} />
          <meshBasicMaterial
            color={esteNeridia ? "#94ffd0" : esteVerdant ? "#77ffad" : esteFlota ? "#ffb96a" : esteKharon ? "#ff2b1c" : esteNoctis ? "#ffbf4b" : "#79edff"}
            transparent
            opacity={0.88}
            depthWrite={false}
            depthTest={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      <group ref={efectTransport} visible={false}>
        <mesh ref={coloanaEnergie} position={[0, 15, 0]}>
          <cylinderGeometry args={[5.5, 10.5, 30, 48, 1, true]} />
          <meshBasicMaterial
            color={culoareEnergie}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>

        <mesh ref={undaSol} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.3, 0]}>
          <ringGeometry args={[8.5, 10.4, 96]} />
          <meshBasicMaterial
            color={culoareAccent}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>

        <mesh ref={undaAer} position={[0, 13, 0]}>
          <ringGeometry args={[8.2, 9.4, 96]} />
          <meshBasicMaterial
            color={culoareRece}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>

        <mesh ref={flashCentral} position={[0, 13, 0]}>
          <circleGeometry args={[11, 64]} />
          <meshBasicMaterial
            color={esteNeridia ? "#e3fff1" : esteVerdant ? "#e1ffe7" : esteFlota ? "#ffe2bb" : esteKharon ? "#ffcab0" : esteNoctis ? "#fff0ba" : "#c9fbff"}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>

        {dateParticule.map((particula, index) => (
          <mesh
            key={index}
            ref={(nod) => {
              particule.current[index] = nod;
            }}
            position={[particula.x, 2, particula.z]}
          >
            <octahedronGeometry args={[0.62, 0]} />
            <meshBasicMaterial
              color={index % 2 === 0 ? culoareRece : culoareAccent}
              transparent
              opacity={0}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}

        <pointLight ref={luminaTransport} color={culoareEnergie} intensity={0} distance={88} position={[0, 14, 0]} />
      </group>

      <pointLight color={culoareEnergie} intensity={4.2} distance={58} position={[0, 8, 0]} />
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

const vertexShaderFundal = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShaderFundal = `
  uniform sampler2D uTextura0;
  uniform vec2 uScara;
  uniform float uTemaAether;
  varying vec2 vUv;

  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float zgomot(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float nebulozitate(vec2 p) {
    float valoare = 0.0;
    float amplitudine = 0.52;
    mat2 rotatie = mat2(0.80, -0.60, 0.60, 0.80);
    for (int i = 0; i < 5; i++) {
      valoare += zgomot(p) * amplitudine;
      p = rotatie * p * 2.03 + vec2(11.7, 7.3);
      amplitudine *= 0.5;
    }
    return valoare;
  }

  vec3 adaugaPlaneta(
    vec3 fundal,
    vec2 uv,
    vec2 centru,
    float raza,
    vec3 culoare,
    float samanta
  ) {
    vec2 punct = uv - centru;
    float distanta = length(punct);
    float mascaCorp = 1.0 - smoothstep(raza * 0.93, raza, distanta);
    float suprafata = nebulozitate(punct * (230.0 + samanta * 17.0) + samanta);
    float lumina = smoothstep(-raza, raza, -punct.x + punct.y * 0.55);
    vec3 corp = culoare * (0.32 + lumina * 0.95) * (0.72 + suprafata * 0.42);
    float margine = 1.0 - smoothstep(raza * 0.72, raza, distanta);
    corp += culoare * margine * 0.16;
    return mix(fundal, corp, mascaCorp);
  }

  vec3 adaugaInel(
    vec3 fundal,
    vec2 uv,
    vec2 centru,
    float raza,
    vec3 culoare
  ) {
    vec2 punct = uv - centru;
    float elipsa = length(vec2(punct.x, punct.y * 3.1));
    float inel = 1.0 - smoothstep(raza * 0.055, raza * 0.11, abs(elipsa - raza));
    inel *= 1.0 - smoothstep(raza * 0.96, raza * 1.02, abs(punct.x));
    return mix(fundal, culoare * 1.45, inel * 0.72);
  }

  void main() {
    vec2 coordonate = vUv * uScara;
    vec2 coordonateLume = (vUv - 0.5) * uScara * 2.8;
    float campRece = nebulozitate(coordonateLume * 0.38 + vec2(2.7, 8.1));
    float campCald = nebulozitate(coordonateLume * 0.51 + vec2(13.4, 3.6));
    float campGol = nebulozitate(coordonateLume * 0.22 + vec2(31.2, 17.8));
    float filamente = smoothstep(0.10, 0.45, abs(campRece - campCald));

    vec3 culoareIntunecata = mix(
      vec3(0.002, 0.009, 0.018),
      vec3(0.008, 0.002, 0.025),
      uTemaAether
    );
    vec3 culoareRece = mix(
      vec3(0.015, 0.48, 0.73),
      vec3(0.27, 0.035, 0.74),
      uTemaAether
    );
    vec3 culoareCalda = mix(
      vec3(0.93, 0.18, 0.018),
      vec3(0.84, 0.045, 0.63),
      uTemaAether
    );

    vec3 culoareProcedurala = culoareIntunecata;
    float ceataRece = smoothstep(0.34, 0.80, campRece) * (0.42 + campGol * 0.34);
    culoareProcedurala = mix(culoareProcedurala, culoareRece, ceataRece * 0.68);
    culoareProcedurala += culoareCalda
      * smoothstep(0.57, 0.86, campCald)
      * (0.19 + filamente * 0.38);
    float detaliuFin = nebulozitate(coordonateLume * 1.85 + vec2(21.7, 4.9));
    culoareProcedurala += mix(culoareRece, culoareCalda, campCald)
      * smoothstep(0.67, 0.90, detaliuFin)
      * 0.13;

    mat2 rotatieTextura = mat2(0.9063, -0.4226, 0.4226, 0.9063);
    vec2 deformare = vec2(
      nebulozitate(coordonate * 0.17 + vec2(4.1, 8.8)),
      nebulozitate(coordonate * 0.19 + vec2(18.7, 2.5))
    ) * 1.85;
    vec3 texturaPrincipala = texture2D(
      uTextura0,
      coordonate * 0.72 + deformare
    ).rgb;
    vec3 texturaSecundara = texture2D(
      uTextura0,
      rotatieTextura * coordonate * 0.41 - deformare * 0.58 + vec2(8.37, 3.14)
    ).rgb;
    vec3 culoare = mix(texturaPrincipala, texturaSecundara, 0.37);
    culoare = mix(culoare, culoareProcedurala, 0.12);

    vec2 coordonateStele = coordonateLume * 7.4;
    vec2 celulaStea = floor(coordonateStele);
    vec2 punctStea = fract(coordonateStele) - 0.5;
    float samantaStea = hash21(celulaStea);
    float stea = (1.0 - smoothstep(0.018, 0.075, length(punctStea)))
      * step(0.972, samantaStea);
    vec3 culoareStea = mix(
      vec3(0.34, 0.84, 1.0),
      vec3(0.76, 0.42, 1.0),
      uTemaAether
    );
    culoare += culoareStea * stea * (0.65 + samantaStea * 1.35);

    vec3 paletaRece = mix(
      vec3(0.12, 0.68, 0.96),
      vec3(0.58, 0.18, 1.0),
      uTemaAether
    );
    vec3 paletaCalda = mix(
      vec3(1.0, 0.31, 0.06),
      vec3(0.93, 0.33, 1.0),
      uTemaAether
    );
    vec2 decalajTema = vec2(uTemaAether * 0.037, uTemaAether * -0.029);

    culoare = adaugaPlaneta(culoare, vUv, vec2(0.12, 0.16) + decalajTema, 0.0048, paletaRece, 1.0);
    culoare = adaugaPlaneta(culoare, vUv, vec2(0.79, 0.13) - decalajTema, 0.0034, paletaCalda, 2.0);
    culoare = adaugaPlaneta(culoare, vUv, vec2(0.91, 0.43) + decalajTema, 0.0062, paletaRece * 0.72, 3.0);
    culoare = adaugaPlaneta(culoare, vUv, vec2(0.24, 0.68) - decalajTema, 0.0028, paletaCalda * 0.85, 4.0);
    culoare = adaugaPlaneta(culoare, vUv, vec2(0.69, 0.79) + decalajTema, 0.0042, paletaRece * 0.58, 5.0);
    culoare = adaugaPlaneta(culoare, vUv, vec2(0.43, 0.91) - decalajTema, 0.0022, paletaCalda * 1.08, 6.0);
    culoare = adaugaInel(culoare, vUv, vec2(0.69, 0.79) + decalajTema, 0.0082, paletaCalda);

    gl_FragColor = vec4(culoare, 1.0);
    #include <colorspace_fragment>
  }
`;

const LATIME_FUNDAL_VIZIBIL = 220;
const INALTIME_FUNDAL_VIZIBIL = 160;

function FundalDistant({ textura, nivelCalitate = "ridicata" }) {
  const fundalRef = useRef();
  const texturaPanorama = useMemo(() => textura.clone(), [textura]);
  const directiePrivire = useMemo(() => new THREE.Vector3(), []);
  const centruVizibil = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    texturaPanorama.colorSpace = THREE.SRGBColorSpace;
    texturaPanorama.anisotropy = 16;
    texturaPanorama.wrapS = THREE.MirroredRepeatWrapping;
    texturaPanorama.wrapT = THREE.MirroredRepeatWrapping;
    texturaPanorama.repeat.set(1, 1);
    texturaPanorama.offset.set(0.44, 0.04);
    texturaPanorama.generateMipmaps = true;
    texturaPanorama.minFilter = THREE.LinearMipmapNearestFilter;
    texturaPanorama.magFilter = THREE.LinearFilter;
    texturaPanorama.needsUpdate = true;

    return () => texturaPanorama.dispose();
  }, [texturaPanorama]);

  useFrame(({ camera }) => {
    if (!fundalRef.current) return;

    camera.getWorldDirection(directiePrivire);
    const distantaPanaLaFundal =
      (-2.4 - camera.position.y) / Math.min(-0.001, directiePrivire.y);
    centruVizibil
      .copy(camera.position)
      .addScaledVector(directiePrivire, distantaPanaLaFundal);

    fundalRef.current.position.x = centruVizibil.x;
    fundalRef.current.position.z = centruVizibil.z;

    const factorParallax = nivelCalitate === "ultra" ? 0.055 : nivelCalitate === "ridicata" ? 0.075 : nivelCalitate === "medie" ? 0.12 : 0.2;
    texturaPanorama.offset.x = THREE.MathUtils.euclideanModulo(
      0.44 + (centruVizibil.x / LATIME_FUNDAL_VIZIBIL) * factorParallax,
      2
    );
    texturaPanorama.offset.y = THREE.MathUtils.euclideanModulo(
      0.04 - (centruVizibil.z / INALTIME_FUNDAL_VIZIBIL) * factorParallax,
      2
    );
  });

  return (
    <mesh
      ref={fundalRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -2.4, 0]}
      frustumCulled={false}
    >
      <planeGeometry args={[LATIME_FUNDAL_VIZIBIL, INALTIME_FUNDAL_VIZIBIL]} />
      <meshBasicMaterial
        map={texturaPanorama}
        toneMapped={false}
        fog={false}
        depthWrite={false}
      />
    </mesh>
  );
}

const vertexProfunzime = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentProfunzime = `
  uniform vec2 uDeplasare;
  uniform vec2 uDirectie;
  uniform vec3 uCuloare;
  uniform float uTimp;
  uniform float uViteza;
  uniform float uGrila;
  uniform float uSansa;
  uniform float uMarime;
  uniform float uOpacitate;
  uniform float uApropiere;
  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec2 coord = (vUv + uDeplasare) * vec2(uGrila * 1.38, uGrila);
    vec2 celula = floor(coord);
    vec2 local = fract(coord) - 0.5;
    float samanta = hash21(celula);
    if (samanta < 1.0 - uSansa) discard;

    vec2 pozitieStea = vec2(hash21(celula + 2.7), hash21(celula + 8.9)) - 0.5;
    vec2 delta = local - pozitieStea * 0.72;
    vec2 directie = normalize(uDirectie + vec2(0.0001, 0.0001));
    vec2 perpendiculara = vec2(-directie.y, directie.x);
    float longitudinal = dot(delta, directie);
    float lateral = dot(delta, perpendiculara);
    float alungire = 1.0 + uViteza * (3.4 + uApropiere * 9.5);
    float distanta = length(vec2(lateral, longitudinal / alungire));
    float raza = uMarime * (0.62 + hash21(celula + 15.1) * 0.76);
    float stea = 1.0 - smoothstep(raza * 0.2, raza, distanta);
    float licarire = 0.72 + 0.28 * sin(uTimp * (1.2 + samanta * 2.7) + samanta * 24.0);
    float halou = 1.0 - smoothstep(raza * 0.45, raza * 1.85, distanta);
    vec3 culoare = uCuloare * (0.58 + samanta * 0.62);
    float alpha = (stea * 0.72 + halou * 0.16) * licarire * uOpacitate;
    gl_FragColor = vec4(culoare, alpha);
    #include <colorspace_fragment>
  }
`;

const STRATURI_PROFUNZIME = {
  scazuta: [
    { y: -2.08, factor: 0.035, grila: 24, sansa: 0.1, marime: 0.038, opacitate: 0.26, apropiere: 0 },
  ],
  medie: [
    { y: -2.08, factor: 0.018, grila: 31, sansa: 0.1, marime: 0.035, opacitate: 0.28, apropiere: 0 },
    { y: -1.5, factor: 0.24, grila: 23, sansa: 0.085, marime: 0.042, opacitate: 0.3, apropiere: 0.52 },
    { y: 1.15, factor: 0.58, grila: 16, sansa: 0.055, marime: 0.05, opacitate: 0.24, apropiere: 0.95 },
  ],
  ridicata: [
    { y: -2.08, factor: 0.012, grila: 36, sansa: 0.11, marime: 0.032, opacitate: 0.29, apropiere: 0 },
    { y: -1.5, factor: 0.2, grila: 28, sansa: 0.09, marime: 0.039, opacitate: 0.32, apropiere: 0.45 },
    { y: 1.18, factor: 0.56, grila: 19, sansa: 0.06, marime: 0.048, opacitate: 0.27, apropiere: 0.95 },
    { y: 5.7, factor: 0.94, grila: 13, sansa: 0.035, marime: 0.055, opacitate: 0.2, apropiere: 1.35, primPlan: true },
  ],
  ultra: [
    { y: -2.08, factor: 0.008, grila: 42, sansa: 0.12, marime: 0.03, opacitate: 0.3, apropiere: 0 },
    { y: -1.5, factor: 0.17, grila: 32, sansa: 0.095, marime: 0.037, opacitate: 0.34, apropiere: 0.42 },
    { y: 0.9, factor: 0.52, grila: 22, sansa: 0.065, marime: 0.045, opacitate: 0.29, apropiere: 0.92 },
    { y: 4.8, factor: 0.94, grila: 15, sansa: 0.04, marime: 0.052, opacitate: 0.22, apropiere: 1.3, primPlan: true },
    { y: 8.2, factor: 1.42, grila: 11, sansa: 0.025, marime: 0.06, opacitate: 0.16, apropiere: 1.7, primPlan: true },
  ],
};

function StratProfunzime({ configurare, playerRef, culoare, index }) {
  const meshRef = useRef();
  const ultimaPozitie = useRef(null);
  const uniforme = useMemo(() => ({
    uDeplasare: { value: new THREE.Vector2() },
    uDirectie: { value: new THREE.Vector2(0, 1) },
    uCuloare: { value: new THREE.Color(culoare) },
    uTimp: { value: index * 2.7 },
    uViteza: { value: 0 },
    uGrila: { value: configurare.grila },
    uSansa: { value: configurare.sansa },
    uMarime: { value: configurare.marime },
    uOpacitate: { value: configurare.opacitate },
    uApropiere: { value: configurare.apropiere },
  }), [configurare, culoare, index]);
  const directiePrivire = useMemo(() => new THREE.Vector3(), []);
  const centruVizibil = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera, clock }, delta) => {
    if (!meshRef.current || !playerRef?.current) return;
    camera.getWorldDirection(directiePrivire);
    const distantaFundal = (configurare.y - camera.position.y) / Math.min(-0.001, directiePrivire.y);
    centruVizibil.copy(camera.position).addScaledVector(directiePrivire, distantaFundal);
    meshRef.current.position.set(centruVizibil.x, configurare.y, centruVizibil.z);

    const x = playerRef.current.x;
    const z = playerRef.current.z;
    uniforme.uDeplasare.value.set(
      (x / 260) * configurare.factor,
      (-z / 190) * configurare.factor,
    );
    if (ultimaPozitie.current) {
      const dx = x - ultimaPozitie.current.x;
      const dz = z - ultimaPozitie.current.z;
      const distanta = Math.hypot(dx, dz);
      if (distanta > 0.0001 && distanta < 80) {
        uniforme.uDirectie.value.lerp(new THREE.Vector2(dx / distanta, -dz / distanta), 0.18);
        const viteza = Math.min(1, distanta / Math.max(0.016, delta) / 9);
        uniforme.uViteza.value = THREE.MathUtils.lerp(uniforme.uViteza.value, viteza, 0.12);
      } else {
        uniforme.uViteza.value *= 0.88;
      }
    }
    ultimaPozitie.current = { x, z };
    uniforme.uTimp.value = clock.elapsedTime + index * 2.7;
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}
      renderOrder={configurare.primPlan ? 88 : 3 + index} raycast={() => null}>
      <planeGeometry args={[260, 190]} />
      <shaderMaterial uniforms={uniforme} vertexShader={vertexProfunzime} fragmentShader={fragmentProfunzime}
        transparent depthWrite={false} depthTest={!configurare.primPlan} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

const fragmentNebuloasaParallax = `
  uniform vec2 uDeplasare;
  uniform vec3 uCuloare;
  uniform float uTimp;
  uniform float uScara;
  uniform float uOpacitate;
  varying vec2 vUv;

  float hashNeb(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float zgomotNeb(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hashNeb(i), hashNeb(i + vec2(1.0, 0.0)), f.x),
      mix(hashNeb(i + vec2(0.0, 1.0)), hashNeb(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbmNeb(vec2 p) {
    float valoare = 0.0;
    valoare += zgomotNeb(p) * 0.55;
    valoare += zgomotNeb(p * 2.03 + 4.7) * 0.29;
    valoare += zgomotNeb(p * 4.11 - 8.2) * 0.16;
    return valoare;
  }
  void main() {
    vec2 p = (vUv - 0.5) * vec2(1.45, 1.0) * uScara + uDeplasare;
    p += vec2(uTimp * 0.006, -uTimp * 0.004);
    float nor = fbmNeb(p);
    float goluri = fbmNeb(p * 0.61 - 12.4);
    float forma = smoothstep(0.5, 0.82, nor) * smoothstep(0.28, 0.72, goluri);
    vec3 culoare = uCuloare * mix(0.22, 0.72, nor);
    gl_FragColor = vec4(culoare, forma * uOpacitate);
    #include <colorspace_fragment>
  }
`;

const STRATURI_NEBULOASA = {
  scazuta: [],
  medie: [
    { y: -1.82, factor: 0.12, scara: 4.4, opacitate: 0.075 },
  ],
  ridicata: [
    { y: -1.84, factor: 0.08, scara: 4.8, opacitate: 0.08 },
    { y: -0.72, factor: 0.36, scara: 6.2, opacitate: 0.055 },
  ],
  ultra: [
    { y: -1.86, factor: 0.045, scara: 5.2, opacitate: 0.09 },
    { y: -0.58, factor: 0.42, scara: 6.8, opacitate: 0.07 },
    { y: 2.15, factor: 0.78, scara: 8.5, opacitate: 0.038 },
  ],
};

function StratNebuloasaParallax({ configurare, playerRef, culoare, index }) {
  const meshRef = useRef();
  const directiePrivire = useMemo(() => new THREE.Vector3(), []);
  const centruVizibil = useMemo(() => new THREE.Vector3(), []);
  const uniforme = useMemo(() => ({
    uDeplasare: { value: new THREE.Vector2() },
    uCuloare: { value: new THREE.Color(culoare).offsetHSL(index % 2 ? 0.045 : -0.025, -0.08, -0.05) },
    uTimp: { value: index * 8.1 },
    uScara: { value: configurare.scara },
    uOpacitate: { value: configurare.opacitate },
  }), [configurare, culoare, index]);

  useFrame(({ camera, clock }) => {
    if (!meshRef.current || !playerRef?.current) return;
    camera.getWorldDirection(directiePrivire);
    const distantaFundal = (configurare.y - camera.position.y) / Math.min(-0.001, directiePrivire.y);
    centruVizibil.copy(camera.position).addScaledVector(directiePrivire, distantaFundal);
    meshRef.current.position.set(centruVizibil.x, configurare.y, centruVizibil.z);
    uniforme.uDeplasare.value.set(
      (playerRef.current.x / 310) * configurare.factor,
      (-playerRef.current.z / 230) * configurare.factor,
    );
    uniforme.uTimp.value = clock.elapsedTime + index * 8.1;
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}
      renderOrder={2 + index} raycast={() => null}>
      <planeGeometry args={[315, 235]} />
      <shaderMaterial uniforms={uniforme} vertexShader={vertexProfunzime} fragmentShader={fragmentNebuloasaParallax}
        transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

function ProfunzimeSpatiala({ nivelCalitate, playerRef, culoare }) {
  const straturi = STRATURI_PROFUNZIME[nivelCalitate] ?? STRATURI_PROFUNZIME.ridicata;
  const nebuloase = STRATURI_NEBULOASA[nivelCalitate] ?? STRATURI_NEBULOASA.ridicata;
  return (
    <>
      {nebuloase.map((configurare, index) => (
        <StratNebuloasaParallax key={`neb-${nivelCalitate}-${index}`} configurare={configurare}
          playerRef={playerRef} culoare={culoare} index={index} />
      ))}
      {straturi.map((configurare, index) => (
        <StratProfunzime key={`stele-${nivelCalitate}-${index}`} configurare={configurare}
          playerRef={playerRef} culoare={culoare} index={index} />
      ))}
    </>
  );
}

function generatorDeterminist(samanta) {
  let stare = samanta >>> 0;
  return () => {
    stare = (stare * 1664525 + 1013904223) >>> 0;
    return stare / 4294967296;
  };
}

function creeazaGeometrie(pozitii, culori) {
  const geometrie = new THREE.BufferGeometry();
  geometrie.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(pozitii, 3)
  );
  if (culori) {
    geometrie.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(culori, 3)
    );
  }
  geometrie.computeBoundingSphere();
  return geometrie;
}

function DecorSpatialUnic({ marimeHarta, temaAether, temaNoctis = false, temaKharon = false, temaFlota = false, temaVerdant = false, temaNeridia = false, temaFrontiera15 = false, temaFrontiera16 = false, temaFrontiera17 = false, temaFrontiera18 = false, temaSectorNou = null }) {
  const decor = useMemo(() => {
    const aleator = generatorDeterminist(
      temaSectorNou ? SECTOARE_NOI[temaSectorNou].seed : temaFrontiera18 ? 0x18f4a823 : temaFrontiera17 ? 0x17f4a813 : temaFrontiera16 ? 0x16f4a803 : temaFrontiera15 ? 0x15f3a709 : temaNeridia ? 0x2b7a5e31 : temaVerdant ? 0x6a3e90bf : temaFlota ? 0x3c175a9e : temaKharon ? 0x7a13d04f : temaNoctis ? 0x4e0c715a : temaAether ? 0xa37ae771 : 0x51c0b17d
    );
    const latimeHarta = marimeHarta * (16 / 9);
    const coloane = 18;
    const randuri = 11;
    const pasX = latimeHarta / coloane;
    const pasZ = marimeHarta / randuri;
    const pozitiiStele = [];
    const pozitiiLinii = [];
    const pozitiiGalaxii = [];
    const culoriGalaxii = [];
    const paleta = temaSectorNou
      ? SECTOARE_NOI[temaSectorNou].paleta.map((culoare) => new THREE.Color(culoare))
      : temaFrontiera18
      ? [new THREE.Color("#ff5073"), new THREE.Color("#7144a8"), new THREE.Color("#e5a779")]
      : temaFrontiera17
      ? [new THREE.Color("#d29a6b"), new THREE.Color("#70526d"), new THREE.Color("#ffd59c")]
      : temaFrontiera16
      ? [new THREE.Color("#ff7d4d"), new THREE.Color("#a63840"), new THREE.Color("#d9a06f")]
      : temaFrontiera15
      ? [new THREE.Color("#7898dc"), new THREE.Color("#7a536d"), new THREE.Color("#bd8570")]
      : temaNeridia
      ? [new THREE.Color("#61eab2"), new THREE.Color("#188873"), new THREE.Color("#a5ffcb")]
      : temaVerdant
      ? [new THREE.Color("#69e7a3"), new THREE.Color("#aa2b2b"), new THREE.Color("#54a56a")]
      : temaFlota
      ? [new THREE.Color("#ff6744"), new THREE.Color("#8f1c23"), new THREE.Color("#d6694a")]
      : temaKharon
      ? [new THREE.Color("#ff2b1c"), new THREE.Color("#7b0011"), new THREE.Color("#55304f")]
      : temaNoctis
      ? [new THREE.Color("#ffb24a"), new THREE.Color("#e7542c"), new THREE.Color("#51d9df")]
      : temaAether
      ? [new THREE.Color("#f2b4ff"), new THREE.Color("#9a63ff"), new THREE.Color("#65ddff")]
      : [new THREE.Color("#a9efff"), new THREE.Color("#79a8ff"), new THREE.Color("#ffd38a")];

    for (let rand = 0; rand < randuri; rand += 1) {
      for (let coloana = 0; coloana < coloane; coloana += 1) {
        const centruX = -latimeHarta / 2 + (coloana + 0.18 + aleator() * 0.64) * pasX;
        const centruZ = -marimeHarta / 2 + (rand + 0.18 + aleator() * 0.64) * pasZ;
        const numarStele = 4 + Math.floor(aleator() * 5);
        const rotatie = aleator() * Math.PI * 2;
        const razaX = 13 + aleator() * 23;
        const razaZ = 9 + aleator() * 17;
        const noduri = [];

        for (let index = 0; index < numarStele; index += 1) {
          const progres = index / numarStele;
          const unghi = rotatie + progres * Math.PI * 2 + (aleator() - 0.5) * 0.72;
          const raza = 0.32 + aleator() * 0.68;
          const x = centruX + Math.cos(unghi) * razaX * raza;
          const z = centruZ + Math.sin(unghi) * razaZ * raza;
          noduri.push([x, -1.92, z]);
          pozitiiStele.push(x, -1.92, z);
        }

        for (let index = 1; index < noduri.length; index += 1) {
          pozitiiLinii.push(...noduri[index - 1], ...noduri[index]);
        }
        if (noduri.length > 5 && aleator() > 0.42) {
          pozitiiLinii.push(...noduri[0], ...noduri[Math.floor(noduri.length / 2)]);
        }

        const sector = rand * coloane + coloana;
        if ((sector + Math.floor(aleator() * 5)) % 7 === 0) {
          const brate = 2 + Math.floor(aleator() * 4);
          const puncte = 72 + Math.floor(aleator() * 50);
          const razaGalaxie = 7 + aleator() * 12;
          const turtire = 0.32 + aleator() * 0.42;
          const rotatieGalaxie = aleator() * Math.PI * 2;
          const culoareBaza = paleta[Math.floor(aleator() * paleta.length)];

          for (let index = 0; index < puncte; index += 1) {
            const brat = index % brate;
            const progres = (index + aleator() * 0.8) / puncte;
            const unghi =
              rotatieGalaxie +
              (brat / brate) * Math.PI * 2 +
              progres * Math.PI * (2.8 + aleator() * 1.7);
            const raza = Math.pow(progres, 0.72) * razaGalaxie;
            const imprastiere = (aleator() - 0.5) * (1.2 + progres * 2.8);
            const x = centruX + Math.cos(unghi) * (raza + imprastiere);
            const z = centruZ + Math.sin(unghi) * (raza + imprastiere) * turtire;
            pozitiiGalaxii.push(x, -2.02, z);
            const lumina = 0.68 + aleator() * 0.44;
            culoriGalaxii.push(
              Math.min(1, culoareBaza.r * lumina),
              Math.min(1, culoareBaza.g * lumina),
              Math.min(1, culoareBaza.b * lumina)
            );
          }
        }
      }
    }

    return {
      stele: creeazaGeometrie(pozitiiStele),
      linii: creeazaGeometrie(pozitiiLinii),
      galaxii: creeazaGeometrie(pozitiiGalaxii, culoriGalaxii),
    };
  }, [marimeHarta, temaAether, temaNoctis, temaKharon, temaFlota, temaVerdant, temaNeridia, temaFrontiera15, temaFrontiera16, temaFrontiera17, temaFrontiera18, temaSectorNou]);

  useEffect(
    () => () => {
      decor.stele.dispose();
      decor.linii.dispose();
      decor.galaxii.dispose();
    },
    [decor]
  );

  return (
    <group>
      <points geometry={decor.stele} renderOrder={2}>
        <pointsMaterial
          color={temaSectorNou ? SECTOARE_NOI[temaSectorNou].culoare : temaFrontiera18 ? "#ffd3de" : temaFrontiera17 ? "#ffe0bc" : temaFrontiera16 ? "#ffd4bd" : temaFrontiera15 ? "#c9d8ff" : temaNeridia ? "#c0ffe0" : temaVerdant ? "#b7ffd4" : temaFlota ? "#ffb091" : temaKharon ? "#ff7a66" : temaNoctis ? "#ffd19a" : temaAether ? "#f1c4ff" : "#d8f6ff"}
          size={0.82}
          transparent
          opacity={0.9}
          sizeAttenuation
          depthWrite={false}
          toneMapped={false}
        />
      </points>
      <points geometry={decor.galaxii} renderOrder={1}>
        <pointsMaterial
          vertexColors
          size={0.64}
          transparent
          opacity={0.72}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </group>
  );
}

const vertexShaderCorpCeresc = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShaderCorpCeresc = `
  uniform sampler2D uTextura;
  uniform vec2 uCentru;
  uniform vec2 uDecupaj;
  uniform float uAlphaTransparent;
  varying vec2 vUv;

  void main() {
    vec2 uvSursa = uCentru + (vUv - 0.5) * uDecupaj;
    vec4 mostra = texture2D(uTextura, uvSursa);
    float maxim = max(mostra.r, max(mostra.g, mostra.b));
    float minim = min(mostra.r, min(mostra.g, mostra.b));
    float saturatie = maxim - minim;
    float luminozitate = (mostra.r + mostra.g + mostra.b) / 3.0;
    float fundalNeutru = 1.0 - smoothstep(0.018, 0.085, saturatie);
    float fundalDeschis = smoothstep(0.4, 0.58, luminozitate);
    float mascaFundal = 1.0 - fundalNeutru * fundalDeschis;
    vec2 margine = abs(vUv - 0.5) * 2.0;
    float distantaMargine = max(margine.x, margine.y);
    float mascaDreptunghi = 1.0 - smoothstep(0.68, 1.0, distantaMargine);
    float mascaRotunda = 1.0 - smoothstep(0.72, 1.0, length((vUv - 0.5) * 2.0));
    float masca = max(mascaRotunda, mascaDreptunghi * 0.42);
    float alphaFinal = uAlphaTransparent > 0.5
      ? mostra.a
      : mostra.a * masca * mascaFundal;
    if (alphaFinal < 0.025) discard;
    vec3 culoareClara = mostra.rgb * 1.12 + pow(maxim, 4.0) * 0.035;
    gl_FragColor = vec4(culoareClara, alphaFinal);
    #include <colorspace_fragment>
  }
`;

const CORPURI_STANDARD = [
  { centru: [0.13, 0.23], decupaj: [0.25, 0.42], marime: [14, 13] },
  { centru: [0.84, 0.21], decupaj: [0.2, 0.36], marime: [14, 13] },
  { centru: [0.17, 0.71], decupaj: [0.34, 0.32], marime: [17, 10] },
  { centru: [0.87, 0.73], decupaj: [0.26, 0.32], marime: [15, 13] },
  { centru: [0.47, 0.72], decupaj: [0.17, 0.15], marime: [9, 5] },
  { centru: [0.9, 0.51], decupaj: [0.1, 0.15], marime: [7, 6] },
  { centru: [0.955, 0.29], decupaj: [0.07, 0.11], marime: [5, 4] },
];

const CORPURI_AETHER = [
  { centru: [0.15, 0.18], decupaj: [0.27, 0.36], marime: [15, 15] },
  { centru: [0.51, 0.11], decupaj: [0.2, 0.2], marime: [10, 6] },
  { centru: [0.75, 0.18], decupaj: [0.28, 0.32], marime: [13, 11] },
  { centru: [0.9, 0.48], decupaj: [0.2, 0.34], marime: [15, 14] },
  { centru: [0.075, 0.58], decupaj: [0.18, 0.27], marime: [9, 10] },
  { centru: [0.32, 0.4], decupaj: [0.11, 0.15], marime: [8, 7] },
  { centru: [0.34, 0.76], decupaj: [0.18, 0.28], marime: [10, 10] },
  { centru: [0.77, 0.77], decupaj: [0.25, 0.36], marime: [13, 14] },
  { centru: [0.79, 0.44], decupaj: [0.1, 0.14], marime: [8, 6] },
  { centru: [0.955, 0.07], decupaj: [0.11, 0.14], marime: [6, 5] },
];

const CORPURI_NOCTIS = [
  { centru: [0.16, 0.18], decupaj: [0.34, 0.36], marime: [18, 13] },
  { centru: [0.5, 0.12], decupaj: [0.24, 0.22], marime: [13, 7] },
  { centru: [0.85, 0.17], decupaj: [0.27, 0.26], marime: [14, 9] },
  { centru: [0.9, 0.47], decupaj: [0.2, 0.29], marime: [12, 11] },
  { centru: [0.17, 0.71], decupaj: [0.36, 0.43], marime: [18, 15] },
  { centru: [0.5, 0.8], decupaj: [0.23, 0.24], marime: [12, 7] },
  { centru: [0.86, 0.76], decupaj: [0.29, 0.24], marime: [16, 8] },
];

function CorpCerescDinHarta({ textura, definitie, limitaHarta, alphaTransparent = false }) {
  const uniforme = useMemo(
    () => ({
      uTextura: { value: textura },
      uCentru: {
        value: new THREE.Vector2(definitie.centru[0], 1 - definitie.centru[1]),
      },
      uDecupaj: { value: new THREE.Vector2(...definitie.decupaj) },
      uAlphaTransparent: { value: alphaTransparent ? 1 : 0 },
    }),
    [textura, definitie, alphaTransparent]
  );
  const x = (definitie.centru[0] * 2 - 1) * limitaHarta;
  const z = (definitie.centru[1] * 2 - 1) * limitaHarta;

  return (
    <mesh
      position={[x, -1.82, z]}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={3}
    >
      <planeGeometry args={definitie.marime} />
      <shaderMaterial
        uniforms={uniforme}
        vertexShader={vertexShaderCorpCeresc}
        fragmentShader={fragmentShaderCorpCeresc}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function CorpuriCerestiUnice({
  textura,
  marimeHarta,
  temaAether,
  temaNoctis = false,
  temaKharon = false,
  temaFlota = false,
  temaVerdant = false,
  temaNeridia = false,
  temaFrontiera15 = false,
  temaFrontiera16 = false,
  temaFrontiera17 = false,
  temaFrontiera18 = false,
  temaSectorNou = null,
}) {
  const limitaHarta = marimeHarta / 2 - 4.5;
  const corpuri = temaSectorNou
    ? SECTOARE_NOI[temaSectorNou].corpuri
    : temaFrontiera18
    ? CORPURI_FRONTIERA_18
    : temaFrontiera17
    ? CORPURI_FRONTIERA_17
    : temaFrontiera16
    ? CORPURI_FRONTIERA_16
    : temaFrontiera15
    ? CORPURI_FRONTIERA_15
    : temaNeridia
    ? CORPURI_NERIDIA
    : temaVerdant
    ? CORPURI_VERDANT
    : temaFlota
    ? CORPURI_FLOTA
    : temaKharon
    ? CORPURI_KHARON
    : temaNoctis
      ? CORPURI_NOCTIS
      : temaAether
        ? CORPURI_AETHER
        : CORPURI_STANDARD;
  const cheieTema = temaSectorNou ?? (temaFrontiera18 ? "frontiera18" : temaFrontiera17 ? "frontiera17" : temaFrontiera16 ? "frontiera16" : temaFrontiera15 ? "frontiera15" : temaNeridia ? "neridia" : temaVerdant ? "verdant" : temaFlota ? "flota" : temaKharon ? "kharon" : temaNoctis ? "noctis" : temaAether ? "aether" : "standard");

  return (
    <group>
      {corpuri.map((definitie, index) => (
        <CorpCerescDinHarta
          key={`${cheieTema}-${index}`}
          textura={textura}
          definitie={definitie}
          limitaHarta={limitaHarta}
          alphaTransparent={Boolean(temaSectorNou) || temaKharon || temaFlota || temaVerdant || temaNeridia || temaFrontiera15 || temaFrontiera16 || temaFrontiera17 || temaFrontiera18}
        />
      ))}
    </group>
  );
}

const POZITIE_STATIE_INITIALA = [-550.4, 0.38, -16.1];
const POZITIE_HANGAR_INITIALA = [505, 0.38, -137];

export default function HartaSpatiala({
  marimeHarta,
  imagineFundal = "assets/harta-standard-v2.png",
  imagineCorpuri = "assets/corpuri-standard-transparente.png",
  onAlegeTinta,
  tintaJucator,
  onStareClic,
  playerRef,
  pozitieStatie = POZITIE_STATIE_INITIALA,
  pozitieHangar = POZITIE_HANGAR_INITIALA,
  pozitiePortalAether,
  imaginePortalAether,
  temaPortalAether = "aether",
  pozitiePortalSecundar,
  imaginePortalSecundar,
  temaPortalSecundar = "aether",
  pozitiePortalTertiar,
  imaginePortalTertiar,
  temaPortalTertiar = "aether",
  temaHarta = "standard",
  nivelCalitate = "ridicata",
  doarPortal = false,
  paladiuColectat = new Set(),
  onTransportAether,
  onTransportSecundar,
  onTransportTertiar,
  onPornireTransport,
  semnalTransportAether = 0,
  semnalTransportSecundar = 0,
  semnalTransportTertiar = 0,
}) {
  const { gl } = useThree();
  const latimeHarta = marimeHarta * (16 / 9);
  const inaltimeHarta = marimeHarta;
  const factorScalare = marimeHarta / 210;
  const culoareProfunzime = SECTOARE_NOI[temaHarta]?.culoare
    ?? (temaHarta === "frontiera18" ? "#ffd0dc"
      : temaHarta === "frontiera17" ? "#ffe0b4"
        : temaHarta === "frontiera16" ? "#ffc1a2"
          : temaHarta === "frontiera15" ? "#c5d7ff"
            : temaHarta === "neridia" ? "#a9ffe0"
              : temaHarta === "verdant" ? "#9bffc5"
                : temaHarta === "flota" ? "#ff9a79"
                  : temaHarta === "kharon" ? "#ff806d"
                    : temaHarta === "noctis" ? "#ffd29b"
                      : temaHarta === "aether" ? "#e4c2ff" : "#bdefff");

  const [texturaHarta, texturaCorpuri] = useLoader(
    THREE.TextureLoader,
    [
      `${import.meta.env.BASE_URL}${imagineFundal}`,
      `${import.meta.env.BASE_URL}${imagineCorpuri}`,
    ]
  );
  const anisotropieMaxima = gl.capabilities.getMaxAnisotropy();
  const anisotropie = nivelCalitate === "ultra"
    ? anisotropieMaxima
    : nivelCalitate === "ridicata"
      ? Math.min(8, anisotropieMaxima)
      : nivelCalitate === "medie"
        ? Math.min(4, anisotropieMaxima)
        : 1;
  const folosesteMipmaps = nivelCalitate !== "scazuta";

  useEffect(() => {
    texturaHarta.colorSpace = THREE.SRGBColorSpace;
    texturaHarta.anisotropy = anisotropie;
    texturaHarta.wrapS = THREE.ClampToEdgeWrapping;
    texturaHarta.wrapT = THREE.ClampToEdgeWrapping;
    texturaHarta.repeat.set(1, 1);
    texturaHarta.offset.set(0, 0);
    texturaHarta.generateMipmaps = folosesteMipmaps;
    texturaHarta.minFilter = folosesteMipmaps ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
    texturaHarta.magFilter = THREE.LinearFilter;
    texturaHarta.needsUpdate = true;
  }, [texturaHarta, anisotropie, folosesteMipmaps]);

  useEffect(() => {
    texturaCorpuri.colorSpace = THREE.SRGBColorSpace;
    texturaCorpuri.anisotropy = anisotropie;
    texturaCorpuri.wrapS = THREE.ClampToEdgeWrapping;
    texturaCorpuri.wrapT = THREE.ClampToEdgeWrapping;
    texturaCorpuri.generateMipmaps = folosesteMipmaps;
    texturaCorpuri.minFilter = folosesteMipmaps ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
    texturaCorpuri.magFilter = THREE.LinearFilter;
    texturaCorpuri.needsUpdate = true;
  }, [texturaCorpuri, anisotropie, folosesteMipmaps]);

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
      <FundalDistant textura={texturaHarta} nivelCalitate={nivelCalitate} />
      <ProfunzimeSpatiala nivelCalitate={nivelCalitate} playerRef={playerRef} culoare={culoareProfunzime} />
      <DecorSpatialUnic
        marimeHarta={marimeHarta}
        temaAether={doarPortal}
        temaNoctis={temaHarta === "noctis"}
        temaKharon={temaHarta === "kharon"}
        temaFlota={temaHarta === "flota"}
        temaVerdant={temaHarta === "verdant"}
        temaNeridia={temaHarta === "neridia"}
        temaFrontiera15={temaHarta === "frontiera15"}
        temaFrontiera16={temaHarta === "frontiera16"}
        temaFrontiera17={temaHarta === "frontiera17"}
        temaFrontiera18={temaHarta === "frontiera18"}
        temaSectorNou={SECTOARE_NOI[temaHarta] ? temaHarta : null}
      />
      <CorpuriCerestiUnice
        textura={texturaCorpuri}
        marimeHarta={marimeHarta}
        temaAether={doarPortal}
        temaNoctis={temaHarta === "noctis"}
        temaKharon={temaHarta === "kharon"}
        temaFlota={temaHarta === "flota"}
        temaVerdant={temaHarta === "verdant"}
        temaNeridia={temaHarta === "neridia"}
        temaFrontiera15={temaHarta === "frontiera15"}
        temaFrontiera16={temaHarta === "frontiera16"}
        temaFrontiera17={temaHarta === "frontiera17"}
        temaFrontiera18={temaHarta === "frontiera18"}
        temaSectorNou={SECTOARE_NOI[temaHarta] ? temaHarta : null}
      />
      {(temaHarta === "sector52" || temaHarta === "sector53") && (
        <ZonaPirata tema={temaHarta} colectate={paladiuColectat} onAlegeTinta={onAlegeTinta} playerRef={playerRef} />
      )}

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

      {!doarPortal && (
        <>
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
        </>
      )}

      {pozitiePortalAether && (
        <PortalAether
          pozitie={pozitiePortalAether}
          onTransport={onTransportAether}
          imagine={imaginePortalAether}
          tema={temaPortalAether}
          onPornireTransport={onPornireTransport}
          semnalTransport={semnalTransportAether}
        />
      )}

      {pozitiePortalSecundar && (
        <PortalAether
          pozitie={pozitiePortalSecundar}
          onTransport={onTransportSecundar}
          imagine={imaginePortalSecundar}
          tema={temaPortalSecundar}
          onPornireTransport={onPornireTransport}
          semnalTransport={semnalTransportSecundar}
        />
      )}

      {pozitiePortalTertiar && (
        <PortalAether
          pozitie={pozitiePortalTertiar}
          onTransport={onTransportTertiar}
          imagine={imaginePortalTertiar}
          tema={temaPortalTertiar}
          onPornireTransport={onPornireTransport}
          semnalTransport={semnalTransportTertiar}
        />
      )}

      <TintaIndicator tinta={tintaJucator} />
    </group>
  );
}
