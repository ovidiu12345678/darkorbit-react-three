import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import HartaSpatiala from "./components/HartaSpatiala.jsx";
import InamicGheata from "./components/InamicGheata.jsx";
import NavaJucatorului from "./components/NavaJucatorului.jsx";
import GestionarLupta from "./components/GestionarLupta.jsx";
import InterfataJoc from "./components/InterfataJoc.jsx";
import HartaMini from "./components/HartaMini.jsx";
import ButonFullscreen from "./components/ButonFullscreen.jsx";
import PanouResurse from "./components/PanouResurse.jsx";
import PanouMagazin from "./components/PanouMagazin.jsx";
import PanouHangar from "./components/PanouHangar.jsx";
import NotificareRecompensa from "./components/NotificareRecompensa.jsx";
import { TUNURI_BY_ID, GENERATOARE_BY_ID, GENERATOARE_VITEZA_BY_ID } from "./data/echipament.js";
import { NAVE, NAVE_BY_ID } from "./data/nave.js";

const MARIME_HARTA = 1260;

const POZITIE_STATIE = [-550.4, 0.38, -16.1];
const POZITIE_HANGAR = [-360.4, 0.38, 113.9];

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

const INAMICI_INITIALI = [
  { id: "x-01", pozitie: [-432.4, 2.2, 23.9], culoare: "#8cff6b" },
  { id: "x-02", pozitie: [-622.4, 2.2, 38.9], culoare: "#ff4add" },
  { id: "x-03", pozitie: [-462.4, 2.2, -111.1], culoare: "#36f5ff" },
  { id: "x-04", pozitie: [-617.4, 2.2, -96.1], culoare: "#ffd35a" },
].map((inamic) => ({
  ...inamic,
  scara: 3,
  hp: 3000,
  scut: 300,
  hpMax: 3000,
  scutMax: 300,
  activ: true,
  respawnLa: null,
  nonce: 0,
  impulsLovitura: 0,
}));

export default function App() {
  const playerRef = useRef(new THREE.Vector3(-532.4, 3.2, -16.1));
  const pozitiiInamici = useRef({});
  const ultimaLovituraRef = useRef(0);
  const inamiciRef = useRef(INAMICI_INITIALI);

  const [selectedAmmo, setSelectedAmmo] = useState("x1");
  const [tintaJucator, setTintaJucator] = useState(null);
  const [tintaLive, setTintaLive] = useState(false);
  const [pozitieJucator, setPozitieJucator] = useState([-532.4, 0, -16.1]);
  const [inamici, setInamici] = useState(INAMICI_INITIALI);
  const [tintaSelectata, setTintaSelectata] = useState(null);
  const [ataca, setAtaca] = useState(false);
  const [viata, setViata] = useState(100);
  const [scut, setScut] = useState(0);
  const [atacuri, setAtacuri] = useState(0);
  const [amenintare, setAmenintare] = useState("sector liber");
  const [impulsScut, setImpulsScut] = useState(0);
  const [efecteAtmosferice, setEfecteAtmosferice] = useState({ gaz: 0, radiatie: 0 });
  const [vitezaNava, setVitezaNava] = useState(1);

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
  const [tunuriDetinute, setTunuriDetinute] = useState([]);
  const [naveDetinute, setNaveDetinute] = useState(["orion-01"]);
  const [navaActiva, setNavaActiva] = useState("orion-01");
  const [generatoareDetinute, setGeneratoareDetinute] = useState([]);
  const [vitezaDetinute, setVitezaDetinute] = useState([]);

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

  const acordaRecompensaInamic = useCallback(() => {
    setCredite((valoare) => valoare + RECOMPENSA_INAMIC_GHEATA.credite);
    setUridium((valoare) => valoare + RECOMPENSA_INAMIC_GHEATA.uridium);
    setOnoare((valoare) => valoare + RECOMPENSA_INAMIC_GHEATA.onoare);
    setExperienta((valoare) => valoare + RECOMPENSA_INAMIC_GHEATA.experienta);
    setRecompensaActiva({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, ...RECOMPENSA_INAMIC_GHEATA });
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
    }

    window.addEventListener("keydown", laApasareTasta);
    return () => window.removeEventListener("keydown", laApasareTasta);
  }, []);

  const scutProcent = scutMaxNava > 0 ? (scut / scutMaxNava) * 100 : 0;
  const statistici = { viata, scut: scutProcent, scutMax: scutMaxNava, atacuri, amenintare };

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
            onAlegeTinta={alegeTinta}
            tintaJucator={tintaJucator}
            onStareClic={setTintaLive}
            playerRef={playerRef}
            pozitieStatie={POZITIE_STATIE}
            pozitieHangar={POZITIE_HANGAR}
          />

          {inamici.map((inamic) => (
            <InamicGheata
              key={`${inamic.id}-${inamic.nonce}`}
              id={inamic.id}
              pozitie={inamic.pozitie}
              culoare={inamic.culoare}
              scara={inamic.scara}
              playerRef={playerRef}
              onLovitura={primesteLovitura}
              activ={inamic.activ}
              selectat={inamic.id === tintaSelectata}
              impulsLovitura={inamic.impulsLovitura}
              hp={inamic.hp}
              scut={inamic.scut}
              hpMax={inamic.hpMax}
              scutMax={inamic.scutMax}
              marimeHarta={MARIME_HARTA}
              onSelectare={selecteazaInamic}
              onAtac={atacaInamic}
              onPozitie={raporteazaPozitieInamic}
            />
          ))}

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
          />

          <GestionarLupta
            playerRef={playerRef}
            pozitiiInamici={pozitiiInamici}
            inamici={inamici}
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
        pozitieJucator={pozitieJucator}
        tintaJucator={tintaJucator}
        inamici={inamici}
        onAlegeTinta={alegeTinta}
        pozitieStatie={POZITIE_STATIE}
        pozitieHangar={POZITIE_HANGAR}
        pozitieAndocareHangar={[PLATFORME_HANGAR[2].x, 0, PLATFORME_HANGAR[2].z]}
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
