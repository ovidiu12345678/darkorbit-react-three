import { useCallback, useEffect, useState } from "react";
import {
  NR_SLOTURI_ABILITATI,
  NR_SLOTURI_GENERATOARE,
  NR_SLOTURI_LASERE,
  NR_SLOTURI_SPECIAL,
  NR_SLOTURI_VITEZA,
  NR_SLOTURI_LANSATOR,
  TUNURI_BY_ID,
  GENERATOARE_BY_ID,
  GENERATOARE_VITEZA_BY_ID,
} from "../data/echipament.js";
import { NAVE } from "../data/nave.js";

const POZITIE_BUTON_INITIALA = { bottom: 16, left: 80 };
const POZITIE_PANOU_INITIALA = { top: 50, left: 150 };
const DIMENSIUNE_INITIALA = { latime: 980, inaltime: 745 };
const DIMENSIUNE_MIN = { latime: 760, inaltime: 600 };
const DIMENSIUNE_MAX = { latime: 1300, inaltime: 920 };
const PRAG_CLIC = 5;

function clamp(valoare, min, max) {
  return Math.max(min, Math.min(max, valoare));
}

function formateazaNumar(numar) {
  return Math.round(numar).toLocaleString("ro-RO");
}

const TABURI_HANGAR = [
  { id: "overview", eticheta: "Overview" },
  { id: "echipament", eticheta: "Equipment" },
  { id: "upgrade", eticheta: "Upgrades" },
  { id: "vopsea", eticheta: "Paint Shop" },
  { id: "echipa", eticheta: "Crew" },
  { id: "inventar", eticheta: "Inventory" },
];

const MUNITIE_TIPURI = [
  { id: "x1", eticheta: "X1", culoare: "#59e6ff" },
  { id: "x2", eticheta: "X2", culoare: "#8cff6b" },
  { id: "x3", eticheta: "X3", culoare: "#ffd35a" },
  { id: "x4", eticheta: "X4", culoare: "#ff4add" },
  { id: "sab", eticheta: "SAB", culoare: "#82b7ff" },
  { id: "rsb", eticheta: "RSB", culoare: "#ff6a3d" },
];

const SECTIUNI_STANGA = [
  { id: "lasere", titlu: "LASERS", total: 6 },
  { id: "munitie", titlu: "AMMO", total: 6 },
  { id: "drone", titlu: "DRONES", total: 4 },
];

const SECTIUNI_DREAPTA = [
  { id: "generatoare", titlu: "GENERATORS", total: 4 },
  { id: "rachete", titlu: "ROCKETS", total: 6 },
  { id: "echipament", titlu: "EQUIPMENT", total: 6 },
];

const RANDURI_STARE = [
  [
    { id: "damage", eticheta: "DAMAGE", valoare: "0" },
    { id: "shield", eticheta: "SHIELD", valoare: "0" },
    { id: "speed", eticheta: "SPEED", valoare: "0 m/s" },
  ],
  [
    { id: "cargo", eticheta: "CARGO", valoare: "0 / 500 t" },
    { id: "power", eticheta: "POWER", valoare: "0 / 100" },
    { id: "fuel", eticheta: "FUEL", valoare: "0 / 100" },
  ],
];

function IconaHangarButon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M3 20.5h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M4.6 20.5v-7.4c0-4.6 3.3-8.3 7.4-8.3s7.4 3.7 7.4 8.3v7.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8.4 20.5v-6.1a3.6 3.6 0 0 1 7.2 0v6.1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function IconaMoneda({ tip }) {
  if (tip === "uridium") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M12 2 L19 9 L12 22 L5 9 Z" fill="currentColor" opacity="0.85" />
        <path d="M12 2 L19 9 L12 13 L5 9 Z" fill="currentColor" opacity="0.45" />
      </svg>
    );
  }

  if (tip === "jetoane") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8.6" fill="currentColor" opacity="0.16" />
        <circle cx="12" cy="12" r="8.6" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.18" />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M9.4 9.2c0-1.2 1.1-2 2.6-2s2.6.8 2.6 1.9c0 2.6-5.2 1.4-5.2 4 0 1.1 1.1 1.9 2.6 1.9s2.6-.8 2.6-2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function IconaSlot({ tip }) {
  if (tip === "lasere") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="7.4" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="12" cy="12" r="1.8" fill="currentColor" />
        <path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }

  if (tip === "munitie") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <rect x="9" y="2.5" width="6" height="15" rx="2.6" stroke="currentColor" strokeWidth="1.4" />
        <path d="M9 7.5h6" stroke="currentColor" strokeWidth="1.2" />
        <path d="M10.5 20.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }

  if (tip === "drone") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="2.6" fill="currentColor" />
        <circle cx="5" cy="6.5" r="1.8" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="19" cy="6.5" r="1.8" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="5" cy="17.5" r="1.8" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="19" cy="17.5" r="1.8" stroke="currentColor" strokeWidth="1.3" />
        <path d="M6.5 7.7L10 11M17.5 7.7L14 11M6.5 16.3L10 13M17.5 16.3L14 13" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }

  if (tip === "generatoare") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M12 2.6l7.4 2.7v6.1c0 5-3.2 8.6-7.4 10-4.2-1.4-7.4-5-7.4-10V5.3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M12.8 8l-2.6 4h2.1l-.8 4 3.2-5h-2.2Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" fill="currentColor" fillOpacity="0.5" />
      </svg>
    );
  }

  if (tip === "rachete") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2.5c2.4 2 3.6 5 3.6 8.7 0 2.3-.5 4.3-1.3 6h-4.6c-.8-1.7-1.3-3.7-1.3-6 0-3.7 1.2-6.7 3.6-8.7Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="9.5" r="1.4" stroke="currentColor" strokeWidth="1.2" />
        <path d="M9 17.2 L6.5 21M15 17.2 L17.5 21M10.3 17.2v4M13.7 17.2v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (tip === "viteza") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M13 2 L5 13.5h5.6L11 22l8-11.5h-5.6Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    );
  }

  if (tip === "abilitati") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M12 2L13.8 9.5 21 12l-7.2 2.5L12 22l-1.8-7.5L3 12l7.2-2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      </svg>
    );
  }

  if (tip === "special") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <polygon points="12,2 15.5,9 23,10.2 17.5,15.5 18.9,23 12,19.3 5.1,23 6.5,15.5 1,10.2 8.5,9" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2.6l7.4 2.7v6.1c0 5-3.2 8.6-7.4 10-4.2-1.4-7.4-5-7.4-10V5.3Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconaStare({ tip }) {
  if (tip === "damage") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M4 12 L10 4 L9 11 L14 9 L8 20 L9 13 L4 14Z" fill="currentColor" opacity="0.85" />
      </svg>
    );
  }
  if (tip === "shield") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2.6l7.4 2.7v6.1c0 5-3.2 8.6-7.4 10-4.2-1.4-7.4-5-7.4-10V5.3Z"
          stroke="currentColor"
          strokeWidth="1.4"
        />
      </svg>
    );
  }
  if (tip === "speed") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M3 6 L10 12 L3 18M11 6 L18 12 L11 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (tip === "cargo") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M3.5 8.4 12 4l8.5 4.4-8.5 4.4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M3.5 8.4v7.2L12 20l8.5-4.4V8.4M12 12.8v7.2" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    );
  }
  if (tip === "power") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M13 2 L5 13.5h5.6L11 22l8-11.5h-5.6Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2.8c2.8 3.4 5.4 7 5.4 10.4a5.4 5.4 0 0 1-10.8 0c0-3.4 2.6-7 5.4-10.4Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function IconaTunMic({ culoare }) {
  return (
    <svg viewBox="0 0 64 40" fill="none">
      <rect x="6" y="16" width="34" height="10" rx="3" fill={culoare} opacity="0.92" />
      <rect x="36" y="12" width="16" height="18" rx="4" fill={culoare} />
      <rect x="48" y="17" width="12" height="8" rx="3" fill={culoare} opacity="0.85" />
    </svg>
  );
}

function IconaNavaHangar({ culoare }) {
  return (
    <svg viewBox="0 0 64 64" fill="none">
      <path d="M32 4 L52 50 L32 40 L12 50 Z" fill={culoare} opacity="0.92" />
      <path d="M32 4 L52 50 L32 40 L12 50 Z" fill="#ffffff" opacity="0.12" />
      <path d="M32 40 L32 60" stroke={culoare} strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

function IconaSageataNava({ directie }) {
  const punct = directie === "stanga" ? "M15 5 L7 12 L15 19" : "M9 5 L17 12 L9 19";
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d={punct} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function IconaGeneratorMic({ culoare, forma }) {
  if (forma === "octagon") {
    return (
      <svg viewBox="0 0 64 64" fill="none">
        <path d="M22 6 H42 L58 22 V42 L42 58 H22 L6 42 V22 Z" fill={culoare} opacity="0.88" />
        <circle cx="32" cy="32" r="9" fill="#ffffff" opacity="0.5" />
      </svg>
    );
  }

  if (forma === "inel") {
    return (
      <svg viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="24" stroke={culoare} strokeWidth="9" opacity="0.88" />
      </svg>
    );
  }

  if (forma === "sfera") {
    return (
      <svg viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="23" fill={culoare} opacity="0.88" />
        <circle cx="26" cy="25" r="7" fill="#ffffff" opacity="0.35" />
      </svg>
    );
  }

  if (forma === "cristal") {
    return (
      <svg viewBox="0 0 64 64" fill="none">
        <path d="M32 5 L45 22 L37 58 H27 L19 22 Z" fill={culoare} opacity="0.88" />
      </svg>
    );
  }

  if (forma === "disc") {
    return (
      <svg viewBox="0 0 64 64" fill="none">
        <ellipse cx="32" cy="24" rx="24" ry="7" fill={culoare} opacity="0.5" />
        <ellipse cx="32" cy="32" rx="20" ry="6" fill={culoare} opacity="0.7" />
        <ellipse cx="32" cy="40" rx="24" ry="7" fill={culoare} opacity="0.5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" fill="none">
      <rect x="16" y="8" width="32" height="48" rx="13" fill={culoare} opacity="0.88" />
      <rect x="29" y="18" width="6" height="28" rx="3" fill="#ffffff" opacity="0.5" />
    </svg>
  );
}

function IconaVitezaMic({ culoare = "#5be9ff" }) {
  return (
    <svg viewBox="0 0 64 64" fill="none">
      <path d="M6 38 L34 38 L24 16 L58 30 L30 30 L40 50 Z" fill={culoare} opacity="0.88" />
    </svg>
  );
}

const CATEGORIE_LASERE = "lasere";
const CATEGORIE_GENERATOARE = "generatoare";
const CATEGORIE_VITEZA = "viteza";

function codeazaDrag(tunId, categorie) {
  return JSON.stringify({ tunId, categorie });
}

function decodeazaDrag(text) {
  try {
    const date = JSON.parse(text);
    if (!date.tunId || !date.categorie) return null;
    return date;
  } catch {
    return null;
  }
}

function CardTunInventar({ tun, tip, onClickEchipeaza }) {
  const candTrage = useCallback(
    (eveniment) => {
      eveniment.dataTransfer.setData("text/plain", codeazaDrag(tun.id, CATEGORIE_LASERE));
      eveniment.dataTransfer.effectAllowed = "move";
    },
    [tun.id]
  );

  return (
    <div
      className="hangar-tun-tray-item"
      draggable
      onDragStart={candTrage}
      onClick={onClickEchipeaza}
      title={`${tip.nume} — Damage ${tip.damage} (clic pentru echipare rapida)`}
    >
      {tip.imagine ? <img src={tip.imagine} alt={tip.nume} className="hangar-item-imagine" /> : <IconaTunMic culoare={tip.culoare} />}
      <span>{tip.nume}</span>
    </div>
  );
}

function CardGeneratorInventar({ generator, tip, onClickEchipeaza }) {
  const candTrage = useCallback(
    (eveniment) => {
      eveniment.dataTransfer.setData("text/plain", codeazaDrag(generator.id, CATEGORIE_GENERATOARE));
      eveniment.dataTransfer.effectAllowed = "move";
    },
    [generator.id]
  );

  return (
    <div
      className="hangar-tun-tray-item"
      draggable
      onDragStart={candTrage}
      onClick={onClickEchipeaza}
      title={`${tip.nume} — Scut +${formateazaNumar(tip.capacitate)} — Absorbtie ${tip.absorbtie}% (clic pentru echipare rapida)`}
    >
      {tip.imagine ? <img src={tip.imagine} alt={tip.nume} className="hangar-item-imagine" /> : <IconaGeneratorMic culoare={tip.culoare} forma={tip.forma} />}
      <span>{tip.nume}</span>
    </div>
  );
}

function CardVitezaInventar({ generator, tip, onClickEchipeaza }) {
  const candTrage = useCallback(
    (eveniment) => {
      eveniment.dataTransfer.setData("text/plain", codeazaDrag(generator.id, CATEGORIE_VITEZA));
      eveniment.dataTransfer.effectAllowed = "move";
    },
    [generator.id]
  );

  return (
    <div
      className="hangar-tun-tray-item"
      draggable
      onDragStart={candTrage}
      onClick={onClickEchipeaza}
      title={`${tip.nume} — Putere viteza +${tip.putere}% (clic pentru echipare rapida)`}
    >
      {tip.imagine ? <img src={tip.imagine} alt={tip.nume} className="hangar-item-imagine" /> : <IconaVitezaMic />}
      <span>{tip.nume}</span>
    </div>
  );
}

function SlotEchipare({
  index,
  ocupant,
  categorie,
  acceptaCategorie,
  onDropPeSlot,
  iconaImplicita,
  obtineTip = (tipId) => TUNURI_BY_ID[tipId],
  renderIcona = (tip) => tip?.imagine ? <img src={tip.imagine} alt={tip.nume} className="hangar-item-imagine" /> : <IconaTunMic culoare={tip.culoare} />,
  formateazaStats = (tip) => `Damage ${tip.damage}`,
}) {
  const [planeazaDeasupra, setPlaneazaDeasupra] = useState(false);

  const candIntra = useCallback(
    (eveniment) => {
      eveniment.preventDefault();
      setPlaneazaDeasupra(true);
    },
    []
  );

  const candPleaca = useCallback(() => setPlaneazaDeasupra(false), []);

  const candPlaneaza = useCallback((eveniment) => {
    eveniment.preventDefault();
  }, []);

  const candPica = useCallback(
    (eveniment) => {
      eveniment.preventDefault();
      eveniment.stopPropagation();
      setPlaneazaDeasupra(false);
      const date = decodeazaDrag(eveniment.dataTransfer.getData("text/plain"));
      if (!date || date.categorie !== acceptaCategorie) return;
      onDropPeSlot?.(date.tunId, index);
    },
    [acceptaCategorie, index, onDropPeSlot]
  );

  const candTrageDinSlot = useCallback(
    (eveniment) => {
      if (!ocupant) return;
      eveniment.dataTransfer.setData("text/plain", codeazaDrag(ocupant.id, acceptaCategorie));
      eveniment.dataTransfer.effectAllowed = "move";
    },
    [ocupant, acceptaCategorie]
  );

  const tip = ocupant ? obtineTip(ocupant.tipId) : null;

  return (
    <div
      className={`hangar-slot hangar-slot-echipare ${ocupant ? "ocupat" : ""} ${planeazaDeasupra ? "drag-over" : ""}`}
      onDragEnter={candIntra}
      onDragLeave={candPleaca}
      onDragOver={candPlaneaza}
      onDrop={candPica}
      draggable={Boolean(ocupant)}
      onDragStart={candTrageDinSlot}
      title={tip ? `${tip.nume} — ${formateazaStats(tip)}` : ""}
    >
      {tip ? renderIcona(tip) : iconaImplicita}
      {tip && <span className="hangar-slot-eticheta-mica">{tip.nume}</span>}
    </div>
  );
}

function SectiuneSloturiEchipare({
  titlu,
  iconaTip,
  total,
  categorie,
  sloturiOcupate,
  onDropPeSlot,
  onDropInTray,
  obtineTip,
  renderIcona,
  formateazaStats,
}) {
  const ocupateNumar = sloturiOcupate.filter(Boolean).length;

  const candPicaInTray = useCallback(
    (eveniment) => {
      eveniment.preventDefault();
      const date = decodeazaDrag(eveniment.dataTransfer.getData("text/plain"));
      if (!date || date.categorie !== categorie) return;
      onDropInTray?.(date.tunId);
    },
    [categorie, onDropInTray]
  );

  return (
    <div className="hangar-sectiune hangar-sectiune-echipare">
      <div className="hangar-sectiune-antet">
        <IconaSlot tip={iconaTip} />
        <span>{titlu}</span>
        <strong>
          {ocupateNumar}/{total}
        </strong>
      </div>
      <div
        className="hangar-sectiune-grid hangar-sectiune-grid-echipare"
        onDragOver={(eveniment) => eveniment.preventDefault()}
        onDrop={candPicaInTray}
      >
        {Array.from({ length: total }).map((_, index) => (
          <SlotEchipare
            key={index}
            index={index}
            ocupant={sloturiOcupate[index]}
            acceptaCategorie={categorie}
            onDropPeSlot={onDropPeSlot}
            iconaImplicita={<IconaSlot tip={iconaTip} />}
            obtineTip={obtineTip}
            renderIcona={renderIcona}
            formateazaStats={formateazaStats}
          />
        ))}
      </div>
    </div>
  );
}

function PanouEchipare({
  tunuriDetinute,
  seteazaTunuriDetinute,
  generatoareDetinute = [],
  seteazaGeneratoareDetinute,
  vitezaDetinute = [],
  seteazaVitezaDetinute,
  echiparePermisa = false,
}) {
  const neechipateTunuri = tunuriDetinute.filter((tun) => tun.slot === null);
  const neechipateGeneratoare = generatoareDetinute.filter((gen) => gen.slot === null);
  const neechipateViteza = vitezaDetinute.filter((gen) => gen.slot === null);
  const sloturiLasere = Array.from({ length: NR_SLOTURI_LASERE }, (_, index) =>
    tunuriDetinute.find((tun) => tun.slot === index) || null
  );
  const sloturiGeneratoare = Array.from({ length: NR_SLOTURI_GENERATOARE }, (_, index) =>
    generatoareDetinute.find((gen) => gen.slot === index) || null
  );
  const sloturiViteza = Array.from({ length: NR_SLOTURI_VITEZA }, (_, index) =>
    vitezaDetinute.find((gen) => gen.slot === index) || null
  );

  const echipeazaInSlot = useCallback(
    (tunId, slotIndex) => {
      seteazaTunuriDetinute?.((lista) =>
        lista.map((tun) => {
          if (tun.id === tunId) return { ...tun, slot: slotIndex };
          if (tun.slot === slotIndex) return { ...tun, slot: null };
          return tun;
        })
      );
    },
    [seteazaTunuriDetinute]
  );

  const dezechipeaza = useCallback(
    (tunId) => {
      seteazaTunuriDetinute?.((lista) => lista.map((tun) => (tun.id === tunId ? { ...tun, slot: null } : tun)));
    },
    [seteazaTunuriDetinute]
  );

  const echipeazaGeneratorInSlot = useCallback(
    (generatorId, slotIndex) => {
      seteazaGeneratoareDetinute?.((lista) =>
        lista.map((gen) => {
          if (gen.id === generatorId) return { ...gen, slot: slotIndex };
          if (gen.slot === slotIndex) return { ...gen, slot: null };
          return gen;
        })
      );
    },
    [seteazaGeneratoareDetinute]
  );

  const dezechipeazaGenerator = useCallback(
    (generatorId) => {
      seteazaGeneratoareDetinute?.((lista) =>
        lista.map((gen) => (gen.id === generatorId ? { ...gen, slot: null } : gen))
      );
    },
    [seteazaGeneratoareDetinute]
  );

  const obtineTipGenerator = useCallback((tipId) => GENERATOARE_BY_ID[tipId], []);
  const renderIconaGenerator = useCallback(
    (tip) => tip?.imagine ? <img src={tip.imagine} alt={tip.nume} className="hangar-item-imagine" /> : <IconaGeneratorMic culoare={tip.culoare} forma={tip.forma} />,
    []
  );
  const formateazaStatsGenerator = useCallback(
    (tip) => `Scut +${formateazaNumar(tip.capacitate)} — Absorbtie ${tip.absorbtie}%`,
    []
  );

  const echipeazaVitezaInSlot = useCallback(
    (generatorId, slotIndex) => {
      seteazaVitezaDetinute?.((lista) =>
        lista.map((gen) => {
          if (gen.id === generatorId) return { ...gen, slot: slotIndex };
          if (gen.slot === slotIndex) return { ...gen, slot: null };
          return gen;
        })
      );
    },
    [seteazaVitezaDetinute]
  );

  const dezechipeazaViteza = useCallback(
    (generatorId) => {
      seteazaVitezaDetinute?.((lista) => lista.map((gen) => (gen.id === generatorId ? { ...gen, slot: null } : gen)));
    },
    [seteazaVitezaDetinute]
  );

  const obtineTipViteza = useCallback((tipId) => GENERATOARE_VITEZA_BY_ID[tipId], []);
  const renderIconaViteza = useCallback((tip) => tip?.imagine ? <img src={tip.imagine} alt={tip.nume} className="hangar-item-imagine" /> : <IconaVitezaMic />, []);
  const formateazaStatsViteza = useCallback((tip) => `Putere viteza +${tip.putere}%`, []);

  if (!echiparePermisa) {
    return (
      <div className="panou-hangar-echipare panou-hangar-echipare-blocat">
        <div className="hangar-echipare-blocat-mesaj">
          <svg viewBox="0 0 24 24" fill="none" width="40" height="40">
            <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <strong>Echipare blocata</strong>
          <span>Trebuie sa fii andocat in Hangar pentru a echipa sau dezechipa iteme.</span>
        </div>
        <div className="hangar-echipare-blocat-preview">
          {tunuriDetinute.length + generatoareDetinute.length + vitezaDetinute.length === 0 ? (
            <span className="hangar-tun-tray-gol">Niciun echipament detinut.</span>
          ) : (
            <span className="hangar-tun-tray-gol">
              {tunuriDetinute.length + generatoareDetinute.length + vitezaDetinute.length} item(e) — andocheaza in Hangar pentru echipare.
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="panou-hangar-echipare">
      <div className="hangar-tun-tray">
        <div className="hangar-tun-tray-titlu">Echipament neechipat (trage spre un slot liber)</div>
        <div
          className="hangar-tun-tray-lista"
          onDragOver={(eveniment) => eveniment.preventDefault()}
          onDrop={(eveniment) => {
            eveniment.preventDefault();
            const date = decodeazaDrag(eveniment.dataTransfer.getData("text/plain"));
            if (!date) return;
            if (date.categorie === CATEGORIE_GENERATOARE) dezechipeazaGenerator(date.tunId);
            else if (date.categorie === CATEGORIE_VITEZA) dezechipeazaViteza(date.tunId);
            else dezechipeaza(date.tunId);
          }}
        >
          {neechipateTunuri.length === 0 && neechipateGeneratoare.length === 0 && neechipateViteza.length === 0 ? (
            <span className="hangar-tun-tray-gol">Niciun echipament neechipat. Cumpara din Shop.</span>
          ) : (
            <>
              {neechipateTunuri.map((tun) => {
                const primSlotLiber = sloturiLasere.findIndex((s) => s === null);
                return (
                  <CardTunInventar
                    key={tun.id}
                    tun={tun}
                    tip={TUNURI_BY_ID[tun.tipId]}
                    onClickEchipeaza={primSlotLiber !== -1 ? () => echipeazaInSlot(tun.id, primSlotLiber) : undefined}
                  />
                );
              })}
              {neechipateGeneratoare.map((gen) => {
                const primSlotLiber = sloturiGeneratoare.findIndex((s) => s === null);
                return (
                  <CardGeneratorInventar
                    key={gen.id}
                    generator={gen}
                    tip={GENERATOARE_BY_ID[gen.tipId]}
                    onClickEchipeaza={primSlotLiber !== -1 ? () => echipeazaGeneratorInSlot(gen.id, primSlotLiber) : undefined}
                  />
                );
              })}
              {neechipateViteza.map((gen) => {
                const primSlotLiber = sloturiViteza.findIndex((s) => s === null);
                return (
                  <CardVitezaInventar
                    key={gen.id}
                    generator={gen}
                    tip={GENERATOARE_VITEZA_BY_ID[gen.tipId]}
                    onClickEchipeaza={primSlotLiber !== -1 ? () => echipeazaVitezaInSlot(gen.id, primSlotLiber) : undefined}
                  />
                );
              })}
            </>
          )}
        </div>
      </div>

      <div className="hangar-echipare-grid">
        <SectiuneSloturiEchipare
          titlu="LASERE"
          iconaTip="lasere"
          total={NR_SLOTURI_LASERE}
          categorie={CATEGORIE_LASERE}
          sloturiOcupate={sloturiLasere}
          onDropPeSlot={echipeazaInSlot}
          onDropInTray={dezechipeaza}
        />
        <SectiuneSloturiEchipare
          titlu="GENERATORS"
          iconaTip="generatoare"
          total={NR_SLOTURI_GENERATOARE}
          categorie={CATEGORIE_GENERATOARE}
          sloturiOcupate={sloturiGeneratoare}
          onDropPeSlot={echipeazaGeneratorInSlot}
          onDropInTray={dezechipeazaGenerator}
          obtineTip={obtineTipGenerator}
          renderIcona={renderIconaGenerator}
          formateazaStats={formateazaStatsGenerator}
        />
        <SectiuneSloturiEchipare
          titlu="VITEZA"
          iconaTip="viteza"
          total={NR_SLOTURI_VITEZA}
          categorie={CATEGORIE_VITEZA}
          sloturiOcupate={sloturiViteza}
          onDropPeSlot={echipeazaVitezaInSlot}
          onDropInTray={dezechipeazaViteza}
          obtineTip={obtineTipViteza}
          renderIcona={renderIconaViteza}
          formateazaStats={formateazaStatsViteza}
        />
        <SectiuneSloturiEchipare
          titlu="TUN LANSATOR RACHETE"
          iconaTip="rachete"
          total={NR_SLOTURI_LANSATOR}
          categorie="lansator"
          sloturiOcupate={Array(NR_SLOTURI_LANSATOR).fill(null)}
          onDropPeSlot={() => {}}
          onDropInTray={() => {}}
        />
        <SectiuneSloturiEchipare
          titlu="ABILITATI EXTRA"
          iconaTip="abilitati"
          total={NR_SLOTURI_ABILITATI}
          categorie="abilitati"
          sloturiOcupate={Array(NR_SLOTURI_ABILITATI).fill(null)}
          onDropPeSlot={() => {}}
          onDropInTray={() => {}}
        />
        <SectiuneSloturiEchipare
          titlu="SPECIAL"
          iconaTip="special"
          total={NR_SLOTURI_SPECIAL}
          categorie="special"
          sloturiOcupate={Array(NR_SLOTURI_SPECIAL).fill(null)}
          onDropPeSlot={() => {}}
          onDropInTray={() => {}}
        />
      </div>
    </div>
  );
}

function SectiuneEchipament({ sectiune, munitie }) {
  if (sectiune.id === "munitie") {
    const tipuriOcupate = MUNITIE_TIPURI.filter((tip) => (munitie?.[tip.id] || 0) > 0).length;

    return (
      <div className="hangar-sectiune" data-total={sectiune.total}>
        <div className="hangar-sectiune-antet">
          <IconaSlot tip={sectiune.id} />
          <span>{sectiune.titlu}</span>
          <strong>
            {tipuriOcupate}/{sectiune.total}
          </strong>
          <button type="button" className="hangar-sectiune-meniu">
            •••
          </button>
        </div>
        <div className="hangar-sectiune-grid">
          {MUNITIE_TIPURI.map((tip) => {
            const cantitate = munitie?.[tip.id] || 0;
            return (
              <div key={tip.id} className={`hangar-slot hangar-slot-munitie ${cantitate > 0 ? "ocupat" : ""}`}>
                <span className="hangar-slot-eticheta" style={{ color: tip.culoare }}>
                  {tip.eticheta}
                </span>
                <span className="hangar-slot-cantitate">{cantitate > 0 ? formateazaNumar(cantitate) : "—"}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="hangar-sectiune" data-total={sectiune.total}>
      <div className="hangar-sectiune-antet">
        <IconaSlot tip={sectiune.id} />
        <span>{sectiune.titlu}</span>
        <strong>0/{sectiune.total}</strong>
        <button type="button" className="hangar-sectiune-meniu">
          •••
        </button>
      </div>
      <div className="hangar-sectiune-grid">
        {Array.from({ length: sectiune.total }).map((_, index) => (
          <div key={index} className="hangar-slot">
            <IconaSlot tip={sectiune.id} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PanouHangar({
  credite = 0,
  uridium = 0,
  munitie,
  tunuriDetinute = [],
  seteazaTunuriDetinute,
  generatoareDetinute = [],
  seteazaGeneratoareDetinute,
  vitezaDetinute = [],
  seteazaVitezaDetinute,
  echiparePermisa = false,
  naveDetinute = ["orion-01"],
  navaActiva = "orion-01",
  seteazaNavaActiva,
  semnalAutoDeschide = 0,
  semnalAutoInchide = 0,
}) {
  const [pozitieButon, setPozitieButon] = useState(POZITIE_BUTON_INITIALA);
  const [pozitiePanou, setPozitiePanou] = useState(POZITIE_PANOU_INITIALA);
  const [dimensiune, setDimensiune] = useState(DIMENSIUNE_INITIALA);
  const [deschis, setDeschis] = useState(false);
  const [tabActiv, setTabActiv] = useState("overview");

  useEffect(() => {
    if (semnalAutoDeschide > 0) {
      setDeschis(true);
    }
  }, [semnalAutoDeschide]);

  useEffect(() => {
    if (semnalAutoInchide > 0) {
      setDeschis(false);
    }
  }, [semnalAutoInchide]);

  const naveProprii = NAVE.filter((nava) => naveDetinute.includes(nava.id));
  const indexNavaActiva = Math.max(0, naveProprii.findIndex((nava) => nava.id === navaActiva));
  const navaCurenta = naveProprii[indexNavaActiva] || NAVE[0];

  const navaAnterioara = useCallback(() => {
    if (naveProprii.length < 2) return;
    const indexNou = (indexNavaActiva - 1 + naveProprii.length) % naveProprii.length;
    seteazaNavaActiva?.(naveProprii[indexNou].id);
  }, [naveProprii, indexNavaActiva, seteazaNavaActiva]);

  const navaUrmatoare = useCallback(() => {
    if (naveProprii.length < 2) return;
    const indexNou = (indexNavaActiva + 1) % naveProprii.length;
    seteazaNavaActiva?.(naveProprii[indexNou].id);
  }, [naveProprii, indexNavaActiva, seteazaNavaActiva]);

  const tragereButon = useCallback(
    (eveniment) => {
      eveniment.preventDefault();

      const startX = eveniment.clientX;
      const startY = eveniment.clientY;
      const startPozitie = { ...pozitieButon };
      let sAMiscat = false;

      const laMiscare = (ev) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        if (Math.abs(dx) > PRAG_CLIC || Math.abs(dy) > PRAG_CLIC) {
          sAMiscat = true;
        }

        setPozitieButon({
          bottom: Math.max(4, startPozitie.bottom - dy),
          left: Math.max(4, startPozitie.left + dx),
        });
      };

      const laRidicare = () => {
        window.removeEventListener("mousemove", laMiscare);
        window.removeEventListener("mouseup", laRidicare);

        if (!sAMiscat) {
          setDeschis((v) => !v);
        }
      };

      window.addEventListener("mousemove", laMiscare);
      window.addEventListener("mouseup", laRidicare);
    },
    [pozitieButon]
  );

  const tragerePanou = useCallback(
    (eveniment) => {
      eveniment.stopPropagation();
      eveniment.preventDefault();

      const startX = eveniment.clientX;
      const startY = eveniment.clientY;
      const startPozitie = { ...pozitiePanou };

      const laMiscare = (ev) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        setPozitiePanou({
          top: Math.max(4, startPozitie.top + dy),
          left: Math.max(4, startPozitie.left + dx),
        });
      };

      const laRidicare = () => {
        window.removeEventListener("mousemove", laMiscare);
        window.removeEventListener("mouseup", laRidicare);
      };

      window.addEventListener("mousemove", laMiscare);
      window.addEventListener("mouseup", laRidicare);
    },
    [pozitiePanou]
  );

  const pornesteRedimensionare = useCallback(
    (eveniment) => {
      eveniment.stopPropagation();
      eveniment.preventDefault();

      const startX = eveniment.clientX;
      const startY = eveniment.clientY;
      const startDimensiune = { ...dimensiune };

      const laMiscare = (ev) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        setDimensiune({
          latime: clamp(startDimensiune.latime + dx, DIMENSIUNE_MIN.latime, DIMENSIUNE_MAX.latime),
          inaltime: clamp(startDimensiune.inaltime + dy, DIMENSIUNE_MIN.inaltime, DIMENSIUNE_MAX.inaltime),
        });
      };

      const laRidicare = () => {
        window.removeEventListener("mousemove", laMiscare);
        window.removeEventListener("mouseup", laRidicare);
      };

      window.addEventListener("mousemove", laMiscare);
      window.addEventListener("mouseup", laRidicare);
    },
    [dimensiune]
  );

  return (
    <>
      <button
        type="button"
        className={`buton-hangar-status ${deschis ? "deschis" : ""}`}
        style={{ bottom: pozitieButon.bottom, left: pozitieButon.left }}
        onMouseDown={tragereButon}
        title="Hangar (trage pentru a muta, clic pentru a deschide)"
      >
        <IconaHangarButon />
      </button>

      {deschis && (
        <div
          className="panou-hangar"
          style={{
            top: pozitiePanou.top,
            left: pozitiePanou.left,
            width: dimensiune.latime,
            height: dimensiune.inaltime,
          }}
        >
          <div className="panou-hangar-antet" onMouseDown={tragerePanou}>
            <span className="panou-hangar-titlu">HANGAR</span>
            <button
              type="button"
              className="panou-hangar-inchide"
              onMouseDown={(ev) => ev.stopPropagation()}
              onClick={() => setDeschis(false)}
            >
              ×
            </button>
          </div>

          <div className="panou-hangar-moneda-bar">
            <div className="hangar-moneda-pill">
              <IconaMoneda tip="credite" />
              <span>Credits: {formateazaNumar(credite)}</span>
            </div>
            <div className="hangar-moneda-pill uridium">
              <IconaMoneda tip="uridium" />
              <span>Uridium: {formateazaNumar(uridium)}</span>
            </div>
            <div className="hangar-moneda-pill jetoane">
              <IconaMoneda tip="jetoane" />
              <span>Tokens: 0</span>
            </div>
            <button type="button" className="hangar-moneda-plus">
              +
            </button>
          </div>

          {tabActiv === "overview" ? (
            <div className="panou-hangar-corp">
              <div className="hangar-coloana">
                {SECTIUNI_STANGA.map((sectiune) => (
                  <SectiuneEchipament key={sectiune.id} sectiune={sectiune} munitie={munitie} />
                ))}
              </div>

              <div className="hangar-centru">
                <div className="hangar-viewport">
                  <button
                    type="button"
                    className="hangar-nava-sageata stanga"
                    onClick={navaAnterioara}
                    disabled={naveProprii.length < 2}
                    title="Nava anterioara"
                  >
                    <IconaSageataNava directie="stanga" />
                  </button>

                  <div className="hangar-viewport-platforma">
                    <div className="hangar-nava-icon">
                      {navaCurenta.imagine ? (
                        <img src={navaCurenta.imagine} alt={navaCurenta.nume} />
                      ) : (
                        <IconaNavaHangar culoare={navaCurenta.culoare} />
                      )}
                    </div>
                    <span className="hangar-nava-nume">{navaCurenta.nume}</span>
                  </div>

                  <button
                    type="button"
                    className="hangar-nava-sageata dreapta"
                    onClick={navaUrmatoare}
                    disabled={naveProprii.length < 2}
                    title="Nava urmatoare"
                  >
                    <IconaSageataNava directie="dreapta" />
                  </button>
                </div>

                <div className="hangar-stare">
                  {RANDURI_STARE.map((coloana, index) => (
                    <div className="hangar-stare-coloana" key={index}>
                      {coloana.map((rand) => (
                        <div className="hangar-stare-rand" key={rand.id}>
                          <IconaStare tip={rand.id} />
                          <span className="hangar-stare-eticheta">{rand.eticheta}</span>
                          <div className="hangar-stare-bara">
                            <div className="hangar-stare-bara-fill" style={{ width: "0%" }} />
                          </div>
                          <span className="hangar-stare-valoare">{rand.valoare}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="hangar-coloana">
                {SECTIUNI_DREAPTA.map((sectiune) => (
                  <SectiuneEchipament key={sectiune.id} sectiune={sectiune} />
                ))}
              </div>
            </div>
          ) : tabActiv === "echipament" ? (
            <PanouEchipare
              tunuriDetinute={tunuriDetinute}
              seteazaTunuriDetinute={seteazaTunuriDetinute}
              generatoareDetinute={generatoareDetinute}
              seteazaGeneratoareDetinute={seteazaGeneratoareDetinute}
              vitezaDetinute={vitezaDetinute}
              seteazaVitezaDetinute={seteazaVitezaDetinute}
              echiparePermisa={echiparePermisa}
            />
          ) : (
            <div className="hangar-gol">In curand disponibil</div>
          )}

          <div className="panou-hangar-footer">
            {TABURI_HANGAR.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`hangar-tab ${tabActiv === tab.id ? "activ" : ""}`}
                onClick={() => setTabActiv(tab.id)}
              >
                {tab.eticheta}
              </button>
            ))}
          </div>

          <div className="panou-hangar-redimensionare" onMouseDown={pornesteRedimensionare} />
        </div>
      )}
    </>
  );
}
