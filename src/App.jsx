import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import HartaSpatiala from "./components/HartaSpatiala.jsx";
import InamicGheata from "./components/InamicGheata.jsx";
import InamicOrnament from "./components/InamicOrnament.jsx";
import InamicAether from "./components/InamicAether.jsx";
import InamicNoctis from "./components/InamicNoctis.jsx";
import NavaJucatorului from "./components/NavaJucatorului.jsx";
import GestionarLupta from "./components/GestionarLupta.jsx";
import InterfataJoc from "./components/InterfataJoc.jsx";
import HartaMini from "./components/HartaMini.jsx";
import ButonFullscreen from "./components/ButonFullscreen.jsx";
import PanouResurse from "./components/PanouResurse.jsx";
import PanouMagazin from "./components/PanouMagazin.jsx";
import PanouHangar from "./components/PanouHangar.jsx";
import NotificareRecompensa from "./components/NotificareRecompensa.jsx";
import MuzicaMartiana from "./components/MuzicaMartiana.jsx";
import {
  TUNURI_BY_ID,
  GENERATOARE_BY_ID,
  GENERATOARE_VITEZA_BY_ID,
  NR_SLOTURI_LASERE,
  NR_SLOTURI_GENERATOARE,
  NR_SLOTURI_VITEZA,
} from "./data/echipament.js";
import { NAVE, NAVE_BY_ID } from "./data/nave.js";

const MARIME_HARTA = 1260;
const FUNDAL_HARTA_STANDARD = "assets/harta-standard-v3.png";
const FUNDAL_HARTA_AETHER = "assets/harta-nebuloasa-aether-v3.png";
const FUNDAL_HARTA_NOCTIS = "assets/harta-ares-noctis.png";
const FUNDAL_JOC_STANDARD = "assets/harta-standard-nebuloasa.png";
const FUNDAL_JOC_AETHER = "assets/harta-aether-nebuloasa.png";
const FUNDAL_JOC_NOCTIS = "assets/fundal-ares-noctis.png";
const CORPURI_HARTA_STANDARD = "assets/corpuri-standard-transparente.png";
const CORPURI_HARTA_AETHER = "assets/corpuri-aether-transparente.png";
const CORPURI_HARTA_NOCTIS = "assets/corpuri-ares-noctis-transparente.png";
const FUNDAL_MINI_STANDARD = FUNDAL_HARTA_STANDARD;
const FUNDAL_MINI_AETHER = FUNDAL_HARTA_AETHER;
const FUNDAL_MINI_NOCTIS = FUNDAL_HARTA_NOCTIS;

const LIMITA_HARTA = MARIME_HARTA / 2 - 4.5;
const FACTOR_SCALARE_HARTA = MARIME_HARTA / 210;
const LATIME_ZONA_RADIATIE = 4.5 * FACTOR_SCALARE_HARTA * 2;
const RAZA_PORTAL_AETHER = 20;
const MARJA_SIGURANTA_PORTAL = 12;
const COORDONATA_PORTAL_AETHER =
  LIMITA_HARTA - LATIME_ZONA_RADIATIE - RAZA_PORTAL_AETHER - MARJA_SIGURANTA_PORTAL;
const DISTANTA_REAPARITIE_PORTAL = 34;
const POZITIE_PORTAL_STANDARD = [COORDONATA_PORTAL_AETHER, 0, COORDONATA_PORTAL_AETHER];
const POZITIE_PORTAL_AETHER = [-COORDONATA_PORTAL_AETHER, 0, -COORDONATA_PORTAL_AETHER];
const POZITIE_PORTAL_NOCTIS_AETHER = [COORDONATA_PORTAL_AETHER, 0, -COORDONATA_PORTAL_AETHER];
const POZITIE_PORTAL_NOCTIS = [COORDONATA_PORTAL_AETHER, 0, -COORDONATA_PORTAL_AETHER];
const RAZA_ZONA_SIGURA_PORTAL = 58;

function esteInZonaSiguraPortal(harta, pozitie) {
  const portaluri = harta === "aether"
    ? [POZITIE_PORTAL_AETHER, POZITIE_PORTAL_NOCTIS_AETHER]
    : harta === "noctis"
      ? [POZITIE_PORTAL_NOCTIS]
      : [POZITIE_PORTAL_STANDARD];

  return portaluri.some((portal) =>
    Math.hypot(pozitie[0] - portal[0], pozitie[2] - portal[2]) <= RAZA_ZONA_SIGURA_PORTAL
  );
}
const POZITIE_INTRARE_AETHER = [
  -COORDONATA_PORTAL_AETHER + DISTANTA_REAPARITIE_PORTAL,
  3.2,
  -COORDONATA_PORTAL_AETHER + DISTANTA_REAPARITIE_PORTAL,
];
const POZITIE_REVENIRE_STANDARD = [
  COORDONATA_PORTAL_AETHER - DISTANTA_REAPARITIE_PORTAL,
  3.2,
  COORDONATA_PORTAL_AETHER - DISTANTA_REAPARITIE_PORTAL,
];

const POZITIE_STATIE = [-550.4, 0.38, -16.1];
const POZITIE_HANGAR = [-360.4, 0.38, 113.9];

function creeazaEchipamentTest(prefix, tipId, numarSloturi) {
  return Array.from({ length: numarSloturi }, (_, slot) => ({
    id: `dev-${prefix}-${slot + 1}`,
    tipId,
    slot,
  }));
}

const TUNURI_TEST = creeazaEchipamentTest("laser", "lf3-pltm", NR_SLOTURI_LASERE);
const SCUTURI_TEST = creeazaEchipamentTest("scut", "helix-barrier", NR_SLOTURI_GENERATOARE);
const VITEZA_TEST = creeazaEchipamentTest("viteza", "mg-vpl1066798x", NR_SLOTURI_VITEZA);

const PLATFORME_HANGAR = [
  { x: POZITIE_HANGAR[0] - 52, z: POZITIE_HANGAR[2] + 21 },
  { x: POZITIE_HANGAR[0] + 48, z: POZITIE_HANGAR[2] + 21 },
  { x: POZITIE_HANGAR[0] - 1, z: POZITIE_HANGAR[2] + 47 },
];
const RAZA_DOCARE_PLATFORMA = 11;

const AMMO_TYPES = [
  { id: "x1", label: "x1", color: "#59e6ff", multiplicator: 1,  shieldDamage: 4,  descriere: "Munitie laser de baza",       imagine: `${import.meta.env.BASE_URL}assets/Munitie x1 (1).png` },
  { id: "x2", label: "x2", color: "#8cff6b", multiplicator: 2,  shieldDamage: 8,  descriere: "Munitie laser imbunatatita",   imagine: `${import.meta.env.BASE_URL}assets/Munitie X2.png` },
  { id: "x3", label: "x3", color: "#ffd35a", multiplicator: 3,  shieldDamage: 12, descriere: "Munitie laser grea",           imagine: `${import.meta.env.BASE_URL}assets/Munitie X3.png` },
  { id: "x4", label: "x4", color: "#ff4add", multiplicator: 4,  shieldDamage: 16, descriere: "Munitie laser de elita",       imagine: `${import.meta.env.BASE_URL}assets/munitie x4.png` },
  { id: "sab", label: "SAB", color: "#82b7ff", multiplicator: 1, shieldDamage: 18, drainShield: true, descriere: "Munitie de drenaj scut", imagine: `${import.meta.env.BASE_URL}assets/munitie Sab.png` },
  { id: "rsb", label: "RSB", color: "#ff6a3d", multiplicator: 4,  shieldDamage: 16, descriere: "Munitie speciala",            imagine: `${import.meta.env.BASE_URL}assets/munitie rsb.png` },
];

function formateazaNumarMunitie(numar) {
  return Math.round(numar).toLocaleString("ro-RO");
}

const AMMO_BY_ID = Object.fromEntries(AMMO_TYPES.map((ammo) => [ammo.id, ammo]));

const RECOMPENSA_INAMIC_GHEATA = { uridium: 350, credite: 650000, onoare: 250, experienta: 6000 };
const RECOMPENSA_INAMIC_ORNAMENT = { credite: 17000000, uridium: 6300, onoare: 10000, experienta: 1000000 };
const RECOMPENSE_AETHER = {
  manta: { credite: 1600000, uridium: 1500, onoare: 1800, experienta: 120000 },
  oculus: { credite: 3800000, uridium: 2700, onoare: 3500, experienta: 280000 },
  chronolith: { credite: 8000000, uridium: 4800, onoare: 7000, experienta: 650000 },
};
const RECOMPENSE_NOCTIS = {
  arici: { credite: 4800000, uridium: 3400, onoare: 4200, experienta: 360000 },
  butoi: { credite: 9800000, uridium: 6200, onoare: 7800, experienta: 820000 },
  stea: { credite: 7600000, uridium: 5400, onoare: 6900, experienta: 670000 },
  puiStea: { credite: 280000, uridium: 220, onoare: 260, experienta: 18000 },
};

const INAMICI_INITIALI = [
  { id: "x-01", pozitie: [-432.4, 2.2, 23.9], culoare: "#8cff6b" },
  { id: "x-02", pozitie: [-622.4, 2.2, 38.9], culoare: "#ff4add" },
  { id: "x-03", pozitie: [-462.4, 2.2, -111.1], culoare: "#36f5ff" },
  { id: "x-04", pozitie: [-617.4, 2.2, -96.1], culoare: "#ffd35a" },
  { id: "x-05", pozitie: [220.4, 2.2, 310.9], culoare: "#8cff6b" },
  { id: "x-06", pozitie: [380.4, 2.2, -260.1], culoare: "#ff4add" },
  { id: "x-07", pozitie: [40.4, 2.2, -420.9], culoare: "#36f5ff" },
  { id: "x-08", pozitie: [470.4, 2.2, 90.1], culoare: "#ffd35a" },
  { id: "x-09", pozitie: [-120.4, 2.2, 460.9], culoare: "#8cff6b" },
].map((inamic) => ({
  ...inamic,
  tip: "gheata",
  scara: 3,
  hp: 3000,
  scut: 300,
  hpMax: 3000,
  scutMax: 300,
  recompensa: RECOMPENSA_INAMIC_GHEATA,
  activ: true,
  respawnLa: null,
  nonce: 0,
  impulsLovitura: 0,
}));

const INAMICI_ORNAMENT_INITIALI = [
  { id: "orn-01", pozitie: [300.4, 2.2, 180.9], culoare: "#ff4a4a" },
  { id: "orn-02", pozitie: [-300.4, 2.2, 200.9], culoare: "#ff4a4a" },
  { id: "orn-03", pozitie: [500.4, 2.2, -450.9], culoare: "#ff4a4a" },
  { id: "orn-04", pozitie: [-500.4, 2.2, -300.9], culoare: "#ff4a4a" },
  { id: "orn-05", pozitie: [150.4, 2.2, -150.9], culoare: "#ff4a4a" },
  { id: "orn-06", pozitie: [-200.4, 2.2, -500.9], culoare: "#ff4a4a" },
  { id: "orn-07", pozitie: [550.4, 2.2, 350.9], culoare: "#ff4a4a" },
  { id: "orn-08", pozitie: [-550.4, 2.2, 350.9], culoare: "#ff4a4a" },
  { id: "orn-09", pozitie: [100.4, 2.2, 550.9], culoare: "#ff4a4a" },
].map((inamic) => ({
  ...inamic,
  tip: "ornament",
  scara: 3,
  hp: 1450000,
  scut: 560000,
  hpMax: 1450000,
  scutMax: 560000,
  recompensa: RECOMPENSA_INAMIC_ORNAMENT,
  activ: true,
  respawnLa: null,
  nonce: 0,
  impulsLovitura: 0,
}));

const INAMICI_AETHER_INITIALI = [
  { id: "aether-manta-01", tipAether: "manta", pozitie: [-360, 2.2, 180] },
  { id: "aether-manta-02", tipAether: "manta", pozitie: [120, 2.2, -280] },
  { id: "aether-manta-03", tipAether: "manta", pozitie: [420, 2.2, 310] },
  { id: "aether-oculus-01", tipAether: "oculus", pozitie: [-110, 2.2, 410] },
  { id: "aether-oculus-02", tipAether: "oculus", pozitie: [330, 2.2, -90] },
  { id: "aether-oculus-03", tipAether: "oculus", pozitie: [-450, 2.2, -260] },
  { id: "aether-chronolith-01", tipAether: "chronolith", pozitie: [210, 2.2, 440] },
  { id: "aether-chronolith-02", tipAether: "chronolith", pozitie: [-350, 2.2, 340] },
  { id: "aether-chronolith-03", tipAether: "chronolith", pozitie: [450, 2.2, -410] },
].map((inamic) => {
  const statistici = {
    manta: { hp: 140000, scut: 90000 },
    oculus: { hp: 260000, scut: 180000 },
    chronolith: { hp: 600000, scut: 420000 },
  }[inamic.tipAether];

  return {
    ...inamic,
    harta: "aether",
    tip: "aether",
    culoare: inamic.tipAether === "manta" ? "#75e9ff" : inamic.tipAether === "oculus" ? "#ff573d" : "#8dff88",
    scara: 2.15,
    hp: statistici.hp,
    scut: statistici.scut,
    hpMax: statistici.hp,
    scutMax: statistici.scut,
    recompensa: RECOMPENSE_AETHER[inamic.tipAether],
    activ: true,
    respawnLa: null,
    nonce: 0,
    impulsLovitura: 0,
  };
});

const INAMICI_NOCTIS_INITIALI = [
  { id: "noctis-arici-01", tipNoctis: "arici", pozitie: [-390, 2.2, -320] },
  { id: "noctis-arici-02", tipNoctis: "arici", pozitie: [70, 2.2, 330] },
  { id: "noctis-arici-03", tipNoctis: "arici", pozitie: [380, 2.2, 170] },
  { id: "noctis-butoi-01", tipNoctis: "butoi", pozitie: [-250, 2.2, 80] },
  { id: "noctis-butoi-02", tipNoctis: "butoi", pozitie: [270, 2.2, -250] },
  { id: "noctis-butoi-03", tipNoctis: "butoi", pozitie: [430, 2.2, 400] },
  { id: "noctis-stea-01", tipNoctis: "stea", pozitie: [-430, 2.2, 350] },
  { id: "noctis-stea-02", tipNoctis: "stea", pozitie: [30, 2.2, -50] },
  { id: "noctis-stea-03", tipNoctis: "stea", pozitie: [260, 2.2, 440] },
  { id: "noctis-pui-stea-01", tipNoctis: "puiStea", pozitie: [-390, 2.2, 310] },
  { id: "noctis-pui-stea-02", tipNoctis: "puiStea", pozitie: [-470, 2.2, 310] },
  { id: "noctis-pui-stea-03", tipNoctis: "puiStea", pozitie: [-390, 2.2, 400] },
  { id: "noctis-pui-stea-04", tipNoctis: "puiStea", pozitie: [-490, 2.2, 410] },
  { id: "noctis-pui-stea-05", tipNoctis: "puiStea", pozitie: [-20, 2.2, -100] },
  { id: "noctis-pui-stea-06", tipNoctis: "puiStea", pozitie: [75, 2.2, -105] },
  { id: "noctis-pui-stea-07", tipNoctis: "puiStea", pozitie: [-30, 2.2, 15] },
  { id: "noctis-pui-stea-08", tipNoctis: "puiStea", pozitie: [90, 2.2, 25] },
  { id: "noctis-pui-stea-09", tipNoctis: "puiStea", pozitie: [210, 2.2, 390] },
  { id: "noctis-pui-stea-10", tipNoctis: "puiStea", pozitie: [315, 2.2, 390] },
  { id: "noctis-pui-stea-11", tipNoctis: "puiStea", pozitie: [205, 2.2, 500] },
  { id: "noctis-pui-stea-12", tipNoctis: "puiStea", pozitie: [330, 2.2, 500] },
].map((inamic) => {
  const statistici = {
    arici: { hp: 340000, scut: 220000 },
    butoi: { hp: 780000, scut: 520000 },
    stea: { hp: 520000, scut: 700000 },
    puiStea: { hp: 42000, scut: 28000 },
  }[inamic.tipNoctis];

  return {
    ...inamic,
    harta: "noctis",
    tip: "noctis",
    culoare: inamic.tipNoctis === "arici" ? "#ff6a24" : inamic.tipNoctis === "butoi" ? "#ff352a" : "#64eff0",
    scara: inamic.tipNoctis === "puiStea" ? 1.35 : 2.15,
    hp: statistici.hp,
    scut: statistici.scut,
    hpMax: statistici.hp,
    scutMax: statistici.scut,
    recompensa: RECOMPENSE_NOCTIS[inamic.tipNoctis],
    activ: true,
    respawnLa: null,
    nonce: 0,
    impulsLovitura: 0,
  };
});

const TOATE_INAMICII_INITIALI = [
  ...INAMICI_INITIALI,
  ...INAMICI_ORNAMENT_INITIALI,
  ...INAMICI_AETHER_INITIALI,
  ...INAMICI_NOCTIS_INITIALI,
];
const POZITIE_INTRARE_NOCTIS = [
  COORDONATA_PORTAL_AETHER - DISTANTA_REAPARITIE_PORTAL,
  3.2,
  -COORDONATA_PORTAL_AETHER + DISTANTA_REAPARITIE_PORTAL,
];
const POZITIE_REVENIRE_AETHER_DIN_NOCTIS = [
  COORDONATA_PORTAL_AETHER - DISTANTA_REAPARITIE_PORTAL,
  3.2,
  -COORDONATA_PORTAL_AETHER + DISTANTA_REAPARITIE_PORTAL,
];

export default function App() {
  const playerRef = useRef(new THREE.Vector3(-532.4, 3.2, -16.1));
  const pozitiiInamici = useRef({});
  const ultimaLovituraRef = useRef(0);
  const inamiciRef = useRef(TOATE_INAMICII_INITIALI);

  const [selectedAmmo, setSelectedAmmo] = useState("x1");
  const [tintaJucator, setTintaJucator] = useState(null);
  const [tintaLive, setTintaLive] = useState(false);
  const [pozitieJucator, setPozitieJucator] = useState([-532.4, 0, -16.1]);
  const [inamici, setInamici] = useState(TOATE_INAMICII_INITIALI);
  const [tintaSelectata, setTintaSelectata] = useState(null);
  const [ataca, setAtaca] = useState(false);
  const [viata, setViata] = useState(100);
  const [scut, setScut] = useState(0);
  const [atacuri, setAtacuri] = useState(0);
  const [amenintare, setAmenintare] = useState("sector liber");
  const [impulsScut, setImpulsScut] = useState(0);
  const [efecteAtmosferice, setEfecteAtmosferice] = useState({ gaz: 0, radiatie: 0 });
  const [vitezaNava, setVitezaNava] = useState(1);
  const [hartaActiva, setHartaActiva] = useState("standard");
  const [semnalTeleportare, setSemnalTeleportare] = useState(0);
  const [semnalTransportPortalAether, setSemnalTransportPortalAether] = useState(0);
  const [semnalTransportPortalSecundar, setSemnalTransportPortalSecundar] = useState(0);
  const [pozitieTeleportare, setPozitieTeleportare] = useState(POZITIE_REVENIRE_STANDARD);
  const jucatorInZonaSiguraPortal = esteInZonaSiguraPortal(hartaActiva, pozitieJucator);

  const [credite, setCredite] = useState(10000000);
  const [uridium, setUridium] = useState(0);
  const [onoare, setOnoare] = useState(0);
  const [experienta, setExperienta] = useState(0);
  const [recompensaActiva, setRecompensaActiva] = useState(null);
  const jackpot = 0;

  const [semnalDocareHangar, setSemnalDocareHangar] = useState(0);
  const [semnalPlecareHangar, setSemnalPlecareHangar] = useState(0);
  const inHangarRef = useRef(false);
  const [esteInHangar, setEsteInHangar] = useState(false);

  const [munitie, setMunitie] = useState({ x1: 3000, x2: 0, x3: 0, x4: 0, sab: 0, rsb: 0 });
  const [tunuriDetinute, setTunuriDetinute] = useState(TUNURI_TEST);
  const [naveDetinute, setNaveDetinute] = useState(["orion-01"]);
  const [navaActiva, setNavaActiva] = useState("orion-01");
  const [generatoareDetinute, setGeneratoareDetinute] = useState(SCUTURI_TEST);
  const [vitezaDetinute, setVitezaDetinute] = useState(VITEZA_TEST);

  const damageLasere = tunuriDetinute.reduce(
    (suma, tun) => (tun.slot !== null ? suma + (TUNURI_BY_ID[tun.tipId]?.damage || 0) : suma),
    0
  );

  const bonusScutGeneratoare = generatoareDetinute.reduce(
    (suma, gen) => (gen.slot !== null ? suma + (GENERATOARE_BY_ID[gen.tipId]?.capacitate || 0) : suma),
    0
  );

  const ABSORBTIE_MAX = 90;
  const absorbtieScut = Math.min(
    ABSORBTIE_MAX,
    generatoareDetinute.reduce(
      (suma, gen) => (gen.slot !== null ? suma + (GENERATOARE_BY_ID[gen.tipId]?.absorbtie || 0) : suma),
      0
    )
  );

  const scutMaxNava = (NAVE_BY_ID[navaActiva]?.scutMax ?? 100) + bonusScutGeneratoare;

  const bonusVitezaProcent = vitezaDetinute.reduce(
    (suma, gen) => (gen.slot !== null ? suma + (GENERATOARE_VITEZA_BY_ID[gen.tipId]?.putere || 0) : suma),
    0
  );

  useEffect(() => {
    setScut((valoare) => scutMaxNava > valoare ? scutMaxNava : Math.min(valoare, scutMaxNava));
  }, [scutMaxNava]);

  useEffect(() => {
    inamiciRef.current = inamici;
  }, [inamici]);

  useEffect(() => {
    const inZona = PLATFORME_HANGAR.some((platforma) => {
      const dx = pozitieJucator[0] - platforma.x;
      const dz = pozitieJucator[2] - platforma.z;
      return Math.hypot(dx, dz) < RAZA_DOCARE_PLATFORMA;
    });

    if (inZona && !inHangarRef.current) {
      inHangarRef.current = true;
      setEsteInHangar(true);
      setSemnalDocareHangar((valoare) => valoare + 1);
    } else if (!inZona && inHangarRef.current) {
      inHangarRef.current = false;
      setEsteInHangar(false);
      setSemnalPlecareHangar((valoare) => valoare + 1);
    }
  }, [pozitieJucator]);

  const declanseazaImpulsScut = useCallback(() => {
    setImpulsScut((valoare) => valoare + 1);
  }, []);

  const transportaPrinPortal = useCallback(() => {
    const intraInAether = hartaActiva !== "aether";

    setPozitieTeleportare(intraInAether ? POZITIE_INTRARE_AETHER : POZITIE_REVENIRE_STANDARD);
    setHartaActiva(intraInAether ? "aether" : "standard");
    setTintaJucator(null);
    setTintaLive(false);
    setTintaSelectata(null);
    setAtaca(false);
    setAmenintare(intraInAether ? "sector Aether" : "sector liber");
    setSemnalTeleportare((valoare) => valoare + 1);
  }, [hartaActiva]);

  const cumparaMunitie = useCallback(
    (id, cantitate, cost, moneda) => {
      if (moneda === "uridium") {
        if (uridium < cost) return { ok: false, disponibil: uridium, lipsa: cost - uridium };
        setUridium((valoare) => valoare - cost);
      } else {
        if (credite < cost) return { ok: false, disponibil: credite, lipsa: cost - credite };
        setCredite((valoare) => valoare - cost);
      }

      setMunitie((valoare) => ({ ...valoare, [id]: (valoare[id] || 0) + cantitate }));
      return { ok: true };
    },
    [credite, uridium]
  );

  const cumparaTun = useCallback(
    (tipId) => {
      const tun = TUNURI_BY_ID[tipId];
      if (!tun) return { ok: false };

      if (tun.moneda === "uridium") {
        if (uridium < tun.cost) return { ok: false, disponibil: uridium, lipsa: tun.cost - uridium };
        setUridium((valoare) => valoare - tun.cost);
      } else {
        if (credite < tun.cost) return { ok: false, disponibil: credite, lipsa: tun.cost - credite };
        setCredite((valoare) => valoare - tun.cost);
      }

      setTunuriDetinute((lista) => [
        ...lista,
        { id: `${tipId}-${Date.now()}-${Math.random().toString(16).slice(2)}`, tipId, slot: null },
      ]);
      return { ok: true };
    },
    [credite, uridium]
  );

  const cumparaGenerator = useCallback(
    (tipId) => {
      const generator = GENERATOARE_BY_ID[tipId];
      if (!generator) return { ok: false };

      if (generator.moneda === "uridium") {
        if (uridium < generator.cost) return { ok: false, disponibil: uridium, lipsa: generator.cost - uridium };
        setUridium((valoare) => valoare - generator.cost);
      } else {
        if (credite < generator.cost) return { ok: false, disponibil: credite, lipsa: generator.cost - credite };
        setCredite((valoare) => valoare - generator.cost);
      }

      setGeneratoareDetinute((lista) => [
        ...lista,
        { id: `${tipId}-${Date.now()}-${Math.random().toString(16).slice(2)}`, tipId, slot: null },
      ]);
      return { ok: true };
    },
    [credite, uridium]
  );

  const cumparaViteza = useCallback(
    (tipId) => {
      const generator = GENERATOARE_VITEZA_BY_ID[tipId];
      if (!generator) return { ok: false };

      if (generator.moneda === "uridium") {
        if (uridium < generator.cost) return { ok: false, disponibil: uridium, lipsa: generator.cost - uridium };
        setUridium((valoare) => valoare - generator.cost);
      } else {
        if (credite < generator.cost) return { ok: false, disponibil: credite, lipsa: generator.cost - credite };
        setCredite((valoare) => valoare - generator.cost);
      }

      setVitezaDetinute((lista) => [
        ...lista,
        { id: `${tipId}-${Date.now()}-${Math.random().toString(16).slice(2)}`, tipId, slot: null },
      ]);
      return { ok: true };
    },
    [credite, uridium]
  );

  const [extraCumparate, setExtraCumparate] = useState([]);

  const cumparaExtra = useCallback(
    (chipId) => {
      const COSTURI = {
        "cip-slot-6": { cost: 40000, moneda: "uridium" },
        "cip-slot-10": { cost: 75000, moneda: "uridium" },
        "cip-rachete-auto": { cost: 25000, moneda: "uridium" },
        "cip-munitie-auto": { cost: 25000, moneda: "uridium" },
      };
      const chip = COSTURI[chipId];
      if (!chip) return { ok: false };
      if (extraCumparate.includes(chipId)) return { ok: true };
      if (uridium < chip.cost) return { ok: false, disponibil: uridium, lipsa: chip.cost - uridium };
      setUridium((v) => v - chip.cost);
      setExtraCumparate((lista) => [...lista, chipId]);
      return { ok: true };
    },
    [credite, uridium, extraCumparate]
  );

  const cumparaNava = useCallback(
    (navaId) => {
      const nava = NAVE_BY_ID[navaId];
      if (!nava) return { ok: false };
      if (naveDetinute.includes(navaId)) return { ok: true };

      if (nava.moneda === "uridium") {
        if (uridium < nava.cost) return { ok: false, disponibil: uridium, lipsa: nava.cost - uridium };
        setUridium((valoare) => valoare - nava.cost);
      } else if (nava.cost > 0) {
        if (credite < nava.cost) return { ok: false, disponibil: credite, lipsa: nava.cost - credite };
        setCredite((valoare) => valoare - nava.cost);
      }

      setNaveDetinute((lista) => [...lista, navaId]);
      return { ok: true };
    },
    [credite, uridium, naveDetinute]
  );

  const consumaMunitie = useCallback((id) => {
    setMunitie((valoare) => {
      const curent = valoare[id] || 0;
      if (curent <= 0) return valoare;
      return { ...valoare, [id]: curent - 1 };
    });
  }, []);

  const acordaRecompensaInamic = useCallback((recompensa = RECOMPENSA_INAMIC_GHEATA) => {
    setCredite((valoare) => valoare + recompensa.credite);
    setUridium((valoare) => valoare + recompensa.uridium);
    setOnoare((valoare) => valoare + recompensa.onoare);
    setExperienta((valoare) => valoare + recompensa.experienta);
    setRecompensaActiva({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, ...recompensa });
  }, []);

  const alegeTinta = useCallback((punct) => {
    const limitaHarta = MARIME_HARTA / 2 - 4.5;

    setTintaJucator([
      THREE.MathUtils.clamp(punct.x, -limitaHarta, limitaHarta),
      0,
      THREE.MathUtils.clamp(punct.z, -limitaHarta, limitaHarta),
    ]);
    setAmenintare((curent) => (curent === "tinta blocata" ? curent : "ruta calculata"));
  }, []);

  const selecteazaInamic = useCallback((id) => {
    setTintaJucator(null);
    setTintaSelectata(id);
    setAtaca(false);
    setAmenintare("tinta selectata");
  }, []);

  const atacaInamic = useCallback((id) => {
    setTintaJucator(null);
    setTintaSelectata(id);
    setAtaca(true);
    setAmenintare("tinta blocata");
  }, []);

  const [daunePrimiteJucator, setDaunePrimiteJucator] = useState([]);

  const primesteLovitura = useCallback((cantitate, damageScut) => {
    ultimaLovituraRef.current = performance.now();
    declanseazaImpulsScut();
    setAtacuri((valoare) => valoare + 1);

    const afisajDauna = damageScut !== undefined ? damageScut : Math.round(cantitate);
    setDaunePrimiteJucator((prev) => [
      ...prev.slice(-4),
      {
        id: `hp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        valoare: afisajDauna,
        viata: 0.9,
        offsetX: (Math.random() - 0.5) * 2.5,
      },
    ]);

    if (damageScut !== undefined) {
      const hpDamage = cantitate * (1 - absorbtieScut / 100);
      setScut((scutCurent) => {
        const scutNou = Math.max(0, scutCurent - damageScut);
        const hpDauna = scutCurent <= 0 ? hpDamage : hpDamage * 0.05;
        if (hpDauna > 0) {
          setViata((viataCurenta) => Math.max(0, viataCurenta - hpDauna));
        }
        return scutNou;
      });
    } else {
      const cantitateRamasa = cantitate * (1 - absorbtieScut / 100);
      setScut((scutCurent) => {
        const dauna = Math.min(scutCurent, cantitateRamasa);
        const ramas = cantitateRamasa - dauna;
        if (ramas > 0) {
          setViata((viataCurenta) => Math.max(0, viataCurenta - ramas));
        }
        return Math.max(0, scutCurent - dauna);
      });
    }

    setAmenintare("contact ostil");
  }, [declanseazaImpulsScut, absorbtieScut]);

  const raporteazaPozitieInamic = useCallback((id, vector) => {
    pozitiiInamici.current[id] = vector.clone();
  }, []);

  useEffect(() => {
    function gaseseTintaApropiata() {
      let celMaiApropiat = null;
      let distantaMinima = 47;

      for (const inamic of inamiciRef.current) {
        if (!inamic.activ) continue;
        if ((inamic.harta ?? "standard") !== hartaActiva) continue;
        const pozitie = pozitiiInamici.current[inamic.id];
        if (!pozitie) continue;
        const distanta = playerRef.current.distanceTo(pozitie);
        if (distanta < distantaMinima) {
          celMaiApropiat = inamic;
          distantaMinima = distanta;
        }
      }

      return celMaiApropiat;
    }

    function laApasareTasta(eveniment) {
      if (eveniment.code === "Digit1") setSelectedAmmo("x1");
      if (eveniment.code === "Digit2") setSelectedAmmo("x2");
      if (eveniment.code === "Digit3") setSelectedAmmo("x3");
      if (eveniment.code === "Digit4") setSelectedAmmo("x4");
      if (eveniment.code === "Digit5") setSelectedAmmo("sab");
      if (eveniment.code === "Digit6") setSelectedAmmo("rsb");

      if (eveniment.code === "Space" && !eveniment.repeat) {
        eveniment.preventDefault();
        const tinta = gaseseTintaApropiata();
        if (!tinta) return;

        setTintaJucator(null);
        setTintaSelectata((curent) => {
          const dezactiveaza = curent === tinta.id;
          setAtaca(!dezactiveaza);
          return dezactiveaza ? null : tinta.id;
        });
        setAmenintare("tinta blocata");
      }

      if (eveniment.code === "KeyJ" && !eveniment.repeat) {
        const elementActiv = eveniment.target;
        const esteCampEditabil = elementActiv instanceof HTMLElement && (
          elementActiv.isContentEditable
          || ["INPUT", "TEXTAREA", "SELECT"].includes(elementActiv.tagName)
        );
        if (esteCampEditabil) return;

        const pozitieCurenta = playerRef.current;
        const portaluriDisponibile = hartaActiva === "aether"
          ? [
              { pozitie: POZITIE_PORTAL_AETHER, secundar: false },
              { pozitie: POZITIE_PORTAL_NOCTIS_AETHER, secundar: true },
            ]
          : hartaActiva === "noctis"
            ? [{ pozitie: POZITIE_PORTAL_NOCTIS, secundar: true }]
            : [{ pozitie: POZITIE_PORTAL_STANDARD, secundar: false }];

        const portalApropiat = portaluriDisponibile
          .map((portal) => ({
            ...portal,
            distanta: Math.hypot(
              pozitieCurenta.x - portal.pozitie[0],
              pozitieCurenta.z - portal.pozitie[2]
            ),
          }))
          .sort((primul, alDoilea) => primul.distanta - alDoilea.distanta)[0];

        if (!portalApropiat || portalApropiat.distanta > RAZA_ZONA_SIGURA_PORTAL) return;
        eveniment.preventDefault();
        if (portalApropiat.secundar) {
          setSemnalTransportPortalSecundar((valoare) => valoare + 1);
        } else {
          setSemnalTransportPortalAether((valoare) => valoare + 1);
        }
        setAmenintare("portal activat · J");
      }
    }

    window.addEventListener("keydown", laApasareTasta);
    return () => window.removeEventListener("keydown", laApasareTasta);
  }, [hartaActiva]);

  useEffect(() => {
    if (!jucatorInZonaSiguraPortal) return;

    setAtaca(false);
    setTintaSelectata(null);
    setAmenintare("zona portal protejata");
    setInamici((lista) => {
      let schimbat = false;
      const urmatoarea = lista.map((inamic) => {
        if ((inamic.harta ?? "standard") !== hartaActiva || !inamic.provocat) return inamic;
        schimbat = true;
        return { ...inamic, provocat: false };
      });
      return schimbat ? urmatoarea : lista;
    });
  }, [hartaActiva, jucatorInZonaSiguraPortal]);

  const transportaPrinPortalNoctis = useCallback(() => {
    const intraInNoctis = hartaActiva !== "noctis";

    setPozitieTeleportare(
      intraInNoctis ? POZITIE_INTRARE_NOCTIS : POZITIE_REVENIRE_AETHER_DIN_NOCTIS
    );
    setHartaActiva(intraInNoctis ? "noctis" : "aether");
    setTintaJucator(null);
    setTintaLive(false);
    setTintaSelectata(null);
    setAtaca(false);
    setAmenintare(intraInNoctis ? "sector Ares Noctis" : "sector Aether");
    setSemnalTeleportare((valoare) => valoare + 1);
  }, [hartaActiva]);

  const scutProcent = scutMaxNava > 0 ? (scut / scutMaxNava) * 100 : 0;
  const statistici = { viata, scut: scutProcent, scutMax: scutMaxNava, atacuri, amenintare };
  const inamiciHartaActiva = inamici.filter(
    (inamic) => (inamic.harta ?? "standard") === hartaActiva
  );
  const luptaMuzicalaActiva = ataca || inamiciHartaActiva.some(
    (inamic) => inamic.activ && inamic.provocat
  );
  const esteNoctis = hartaActiva === "noctis";
  const esteAether = hartaActiva === "aether";
  const esteStandard = hartaActiva === "standard";
  const fundalJoc = esteNoctis
    ? FUNDAL_JOC_NOCTIS
    : esteAether
      ? FUNDAL_JOC_AETHER
      : FUNDAL_JOC_STANDARD;
  const corpuriHarta = esteNoctis
    ? CORPURI_HARTA_NOCTIS
    : esteAether
      ? CORPURI_HARTA_AETHER
      : CORPURI_HARTA_STANDARD;
  const fundalMini = esteNoctis
    ? FUNDAL_MINI_NOCTIS
    : esteAether
      ? FUNDAL_MINI_AETHER
      : FUNDAL_MINI_STANDARD;

  return (
    <>
      <Canvas
        orthographic
        dpr={[1, 1.5]}
        camera={{ position: [-532.4, 68, 37.9], zoom: 18, near: 0.1, far: 600 }}
      >
        <color attach="background" args={["#02040b"]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[40, 90, 20]} intensity={1.3} />

        <Suspense fallback={null}>
          <HartaSpatiala
            marimeHarta={MARIME_HARTA}
            imagineFundal={fundalJoc}
            imagineCorpuri={corpuriHarta}
            onAlegeTinta={alegeTinta}
            tintaJucator={tintaJucator}
            onStareClic={setTintaLive}
            playerRef={playerRef}
            pozitieStatie={POZITIE_STATIE}
            pozitieHangar={POZITIE_HANGAR}
            pozitiePortalAether={esteNoctis ? null : esteAether ? POZITIE_PORTAL_AETHER : POZITIE_PORTAL_STANDARD}
            pozitiePortalSecundar={
              esteNoctis ? POZITIE_PORTAL_NOCTIS : esteAether ? POZITIE_PORTAL_NOCTIS_AETHER : null
            }
            imaginePortalSecundar="assets/portal-ares-noctis.png"
            temaPortalSecundar="noctis"
            temaHarta={esteNoctis ? "noctis" : esteAether ? "aether" : "standard"}
            doarPortal={!esteStandard}
            onTransportAether={transportaPrinPortal}
            onTransportSecundar={transportaPrinPortalNoctis}
            semnalTransportAether={semnalTransportPortalAether}
            semnalTransportSecundar={semnalTransportPortalSecundar}
          />

          {inamiciHartaActiva.map((inamic) => {
            const ComponentaInamic = inamic.tip === "ornament"
              ? InamicOrnament
              : inamic.tip === "aether"
                ? InamicAether
                : inamic.tip === "noctis"
                  ? InamicNoctis
                  : InamicGheata;

            return (
              <ComponentaInamic
                key={`${inamic.id}-${inamic.nonce}`}
                id={inamic.id}
                tipAether={inamic.tipAether}
                tipNoctis={inamic.tipNoctis}
                pozitie={inamic.pozitie}
                culoare={inamic.culoare}
                scara={inamic.scara}
                playerRef={playerRef}
                onLovitura={primesteLovitura}
                activ={inamic.activ}
                selectat={inamic.id === tintaSelectata}
                impulsLovitura={inamic.impulsLovitura}
                provocat={Boolean(inamic.provocat)}
                zonaSiguraJucator={jucatorInZonaSiguraPortal}
                hp={inamic.hp}
                scut={inamic.scut}
                hpMax={inamic.hpMax}
                scutMax={inamic.scutMax}
                marimeHarta={MARIME_HARTA}
                onSelectare={selecteazaInamic}
                onAtac={atacaInamic}
                onPozitie={raporteazaPozitieInamic}
              />
            );
          })}

          <NavaJucatorului
            playerRef={playerRef}
            tintaJucator={tintaJucator}
            tintaLive={tintaLive}
            seteazaTintaJucator={setTintaJucator}
            seteazaPozitieJucator={setPozitieJucator}
            seteazaEfecteAtmosferice={setEfecteAtmosferice}
            marimeHarta={MARIME_HARTA}
            ataca={ataca}
            tintaSelectata={tintaSelectata}
            pozitiiInamici={pozitiiInamici}
            multiplicatorViteza={vitezaNava * (1 + bonusVitezaProcent / 100)}
            viata={viata}
            scut={scut}
            pozitieTeleportare={pozitieTeleportare}
            semnalTeleportare={semnalTeleportare}
          />

          <GestionarLupta
              marimeHarta={MARIME_HARTA}
              playerRef={playerRef}
              pozitiiInamici={pozitiiInamici}
              inamici={inamiciHartaActiva}
              seteazaInamici={setInamici}
              tintaSelectata={tintaSelectata}
              seteazaTintaSelectata={setTintaSelectata}
              ataca={ataca}
              seteazaAtaca={setAtaca}
              munitie={AMMO_BY_ID[selectedAmmo]}
              cantitateMunitie={munitie[selectedAmmo] || 0}
              onConsumaMunitie={() => consumaMunitie(selectedAmmo)}
              damageLasere={damageLasere}
              scutMax={scutMaxNava}
              seteazaScutJucator={setScut}
              declanseazaImpulsScut={declanseazaImpulsScut}
              ultimaLovituraRef={ultimaLovituraRef}
              onStatus={setAmenintare}
              onDistrugeInamic={acordaRecompensaInamic}
              daunePrimiteJucator={daunePrimiteJucator}
              setDaunePrimiteJucator={setDaunePrimiteJucator}
          />
        </Suspense>
      </Canvas>

      <MuzicaMartiana hartaActiva={hartaActiva} luptaActiva={luptaMuzicalaActiva} />

      <div className="bara-munitie" onPointerDown={(event) => event.stopPropagation()}>
        {AMMO_TYPES.map((ammo, index) => {
          const cantitate = munitie[ammo.id] || 0;
          return (
            <button
              key={ammo.id}
              type="button"
              className={`buton-munitie ${selectedAmmo === ammo.id ? "activ" : ""} ${ammo.drainShield ? "speciala" : ""}`}
              style={{ "--ammo-color": ammo.color }}
              onClick={() => setSelectedAmmo(ammo.id)}
            >
              <span className="munitie-tasta">{index + 1}</span>
              {ammo.imagine ? (
                <img src={ammo.imagine} alt={ammo.label} className="munitie-celula-img" />
              ) : (
                <span className="munitie-celula" />
              )}
              <span className="munitie-eticheta">{ammo.label}</span>
              <strong className="munitie-cantitate">{formateazaNumarMunitie(cantitate)}</strong>
              <span className="munitie-tooltip">
                <strong style={{ color: ammo.color }}>{ammo.label}</strong>
                <span>{ammo.descriere}</span>
                <span className="munitie-tooltip-cantitate">Cantitate: {formateazaNumarMunitie(cantitate)}</span>
              </span>
            </button>
          );
        })}
      </div>

      <InterfataJoc
        statistici={statistici}
        efecteAtmosferice={efecteAtmosferice}
        vitezaNava={vitezaNava}
        onSchimbaViteza={setVitezaNava}
      />

      <HartaMini
        marimeHarta={MARIME_HARTA}
        numeHarta={esteNoctis ? "Ares Noctis" : esteAether ? "Aether" : "Sector standard"}
        pozitieJucator={pozitieJucator}
        tintaJucator={tintaJucator}
        inamici={inamiciHartaActiva}
        onAlegeTinta={alegeTinta}
        pozitieStatie={esteStandard ? POZITIE_STATIE : null}
        pozitieHangar={esteStandard ? POZITIE_HANGAR : null}
        pozitieAndocareHangar={
          esteStandard ? [PLATFORME_HANGAR[2].x, 0, PLATFORME_HANGAR[2].z] : null
        }
        pozitiePortal={
          esteNoctis ? POZITIE_PORTAL_NOCTIS : esteAether ? POZITIE_PORTAL_AETHER : POZITIE_PORTAL_STANDARD
        }
        etichetaPortal={esteNoctis ? "Portal spre Aether" : esteAether ? "Portal spre sectorul standard" : "Portal spre Aether"}
        temaPortal={esteNoctis ? "noctis" : "aether"}
        pozitiePortalSecundar={esteAether ? POZITIE_PORTAL_NOCTIS_AETHER : null}
        etichetaPortalSecundar="Portal spre Ares Noctis"
        imagineFundal={fundalMini}
      />

      <ButonFullscreen />

      <PanouResurse
        credite={credite}
        uridium={uridium}
        onoare={onoare}
        experienta={experienta}
        jackpot={jackpot}
      />

      <PanouMagazin
        credite={credite}
        uridium={uridium}
        onCumparaMunitie={cumparaMunitie}
        onCumparaTun={cumparaTun}
        naveDetinute={naveDetinute}
        onCumparaNava={cumparaNava}
        onCumparaGenerator={cumparaGenerator}
        onCumparaViteza={cumparaViteza}
        onCumparaExtra={cumparaExtra}
        extraCumparate={extraCumparate}
      />

      <PanouHangar
        credite={credite}
        uridium={uridium}
        munitie={munitie}
        tunuriDetinute={tunuriDetinute}
        seteazaTunuriDetinute={setTunuriDetinute}
        generatoareDetinute={generatoareDetinute}
        seteazaGeneratoareDetinute={setGeneratoareDetinute}
        vitezaDetinute={vitezaDetinute}
        seteazaVitezaDetinute={setVitezaDetinute}
        naveDetinute={naveDetinute}
        navaActiva={navaActiva}
        seteazaNavaActiva={setNavaActiva}
        semnalAutoDeschide={semnalDocareHangar}
        semnalAutoInchide={semnalPlecareHangar}
        echiparePermisa={esteInHangar}
      />

      <NotificareRecompensa recompensa={recompensaActiva} />
    </>
  );
}
