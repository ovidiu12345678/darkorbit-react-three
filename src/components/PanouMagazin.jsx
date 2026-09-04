import { useCallback, useMemo, useRef, useState } from "react";
import { TUNURI_LASER, GENERATOARE, GENERATOARE_VITEZA } from "../data/echipament.js";
import { NAVE } from "../data/nave.js";

const POZITIE_BUTON_INITIALA = { bottom: 16, right: 16 };
const POZITIE_PANOU_INITIALA = { top: 60, left: 220 };
const DIMENSIUNE_INITIALA = { latime: 760, inaltime: 610 };
const DIMENSIUNE_MIN = { latime: 560, inaltime: 420 };
const DIMENSIUNE_MAX = { latime: 980, inaltime: 760 };
const PRAG_CLIC = 5;

function clamp(valoare, min, max) {
  return Math.max(min, Math.min(max, valoare));
}

function formateazaNumar(numar) {
  return Math.round(numar).toLocaleString("ro-RO");
}

const TABURI = [
  { id: "munitie", eticheta: "Munitie", forma: "munitie" },
  { id: "lasere", eticheta: "Lasere", forma: "lasere" },
  { id: "nave", eticheta: "Nave", forma: "nave" },
  { id: "scuturi", eticheta: "Scuturi", forma: "scuturi" },
  { id: "viteza", eticheta: "Viteza", forma: "viteza" },
  { id: "extra", eticheta: "Extra", forma: "extra" },
  { id: "drone", eticheta: "Drone", forma: "drone" },
  { id: "speciale", eticheta: "Speciale", forma: "speciale" },
];

const ARTICOLE_MUNITIE = [
  { id: "x1", titlu: "X1", descriere: "Munitie laser de baza", cantitate: 10000, cost: 1000, moneda: "credite", culoare: "#59e6ff", imagine: `${import.meta.env.BASE_URL}assets/Munitie x1 (1).png` },
  { id: "x2", titlu: "X2", descriere: "Munitie laser imbunatatita", cantitate: 4000, cost: 60000, moneda: "credite", culoare: "#8cff6b", imagine: `${import.meta.env.BASE_URL}assets/Munitie X2.png` },
  { id: "x3", titlu: "X3", descriere: "Munitie laser grea", cantitate: 1600, cost: 340000, moneda: "credite", culoare: "#ffd35a", imagine: `${import.meta.env.BASE_URL}assets/Munitie X3.png` },
  { id: "x4", titlu: "X4", descriere: "Munitie laser de elita", cantitate: 15000, cost: 35000, moneda: "uridium", culoare: "#ff4add", imagine: `${import.meta.env.BASE_URL}assets/munitie x4.png` },
  { id: "sab", titlu: "SAB", descriere: "Munitie de drenaj scut", cantitate: 50000, cost: 6000, moneda: "uridium", culoare: "#82b7ff", imagine: `${import.meta.env.BASE_URL}assets/munitie Sab.png` },
  { id: "rsb", titlu: "RSB", descriere: "Munitie speciala", culoare: "#ff6a3d", indisponibil: true, imagine: `${import.meta.env.BASE_URL}assets/munitie rsb.png` },
  { id: "rachete-scut", titlu: "RACHETE DAUNE SCUT", descriere: "Rachete specializate pe daune scut — damage 4.000", cantitate: 430, cost: 1500000, moneda: "credite", culoare: "#b06aff", imagine: `${import.meta.env.BASE_URL}assets/munitie rackete daune scut.png` },
  { id: "rachete-hp", titlu: "RACHETE DAUNE HP", descriere: "Rachete specializate pe daune HP — damage 2.500", cantitate: 1300, cost: 600, moneda: "credite", culoare: "#ff5a3d", imagine: `${import.meta.env.BASE_URL}assets/munitie rachete daune hp.png` },
];

function IconaCos() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M3.5 5.5h2l1.6 11.2a1.6 1.6 0 0 0 1.6 1.4h8.4a1.6 1.6 0 0 0 1.6-1.3l1.4-8.3H7.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="9.5" cy="20.5" r="1.3" fill="currentColor" />
      <circle cx="16.5" cy="20.5" r="1.3" fill="currentColor" />
    </svg>
  );
}

function IconaTab({ tip }) {
  if (tip === "munitie") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <rect x="5" y="4" width="2.4" height="16" rx="1.2" fill="currentColor" />
        <rect x="10.8" y="4" width="2.4" height="16" rx="1.2" fill="currentColor" />
        <rect x="16.6" y="4" width="2.4" height="16" rx="1.2" fill="currentColor" />
      </svg>
    );
  }

  if (tip === "lasere") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8.4" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="2.3" fill="currentColor" />
        <path d="M12 2.4v3.4M12 18.2v3.4M2.4 12h3.4M18.2 12h3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (tip === "scuturi") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2.6l7.4 2.7v6.1c0 5-3.2 8.6-7.4 10-4.2-1.4-7.4-5-7.4-10V5.3Z"
          fill="currentColor"
          opacity="0.16"
        />
        <path
          d="M12 2.6l7.4 2.7v6.1c0 5-3.2 8.6-7.4 10-4.2-1.4-7.4-5-7.4-10V5.3Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  if (tip === "nave") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2.5 L17.5 14.5 L12 12.2 L6.5 14.5 Z"
          fill="currentColor"
          opacity="0.9"
        />
        <path d="M12 12.2 L12 21" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }

  if (tip === "drone") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" fill="currentColor" />
        <circle cx="4.5" cy="6" r="2" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="19.5" cy="6" r="2" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="4.5" cy="18" r="2" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="19.5" cy="18" r="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6.1 7.3L10 11M18 7.3L14 11M6.1 16.7L10 13M18 16.7L14 13" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    );
  }

  if (tip === "viteza") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M3 6 L10 12 L3 18M11 6 L18 12 L11 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (tip === "extra") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M16.5 13.5v7.5M13.5 17.25h7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2 L14.7 8.6 L22 9.3 L16.6 14.1 L18.2 21 L12 17.3 L5.8 21 L7.4 14.1 L2 9.3 L9.3 8.6 Z"
        fill="currentColor"
        opacity="0.9"
      />
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

function IconaProiectil({ culoare }) {
  return (
    <svg viewBox="0 0 64 36" fill="none">
      <rect x="4" y="11" width="40" height="14" rx="6" fill={culoare} opacity="0.9" />
      <path d="M44 11 L58 18 L44 25 Z" fill={culoare} />
      <rect x="4" y="11" width="40" height="14" rx="6" fill="#ffffff" opacity="0.12" />
      <rect x="10" y="15" width="22" height="2.6" rx="1.3" fill="#ffffff" opacity="0.35" />
    </svg>
  );
}

function IconaTunLaser({ culoare }) {
  return (
    <svg viewBox="0 0 64 40" fill="none">
      <rect x="6" y="16" width="34" height="10" rx="3" fill={culoare} opacity="0.92" />
      <rect x="36" y="12" width="16" height="18" rx="4" fill={culoare} />
      <rect x="48" y="17" width="12" height="8" rx="3" fill={culoare} opacity="0.85" />
      <rect x="6" y="16" width="34" height="10" rx="3" fill="#ffffff" opacity="0.14" />
      <rect x="12" y="19" width="18" height="2.4" rx="1.2" fill="#ffffff" opacity="0.4" />
      <circle cx="58" cy="21" r="2.6" fill="#ffffff" opacity="0.55" />
    </svg>
  );
}

function IconaGenerator({ culoare, forma }) {
  if (forma === "octagon") {
    return (
      <svg viewBox="0 0 64 64" fill="none">
        <path d="M22 6 H42 L58 22 V42 L42 58 H22 L6 42 V22 Z" fill={culoare} opacity="0.88" />
        <path d="M22 6 H42 L58 22 V42 L42 58 H22 L6 42 V22 Z" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="2" />
        <circle cx="32" cy="32" r="11" fill="#ffffff" opacity="0.5" />
        <circle cx="32" cy="32" r="6" fill={culoare} />
      </svg>
    );
  }

  if (forma === "inel") {
    return (
      <svg viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="26" stroke={culoare} strokeWidth="9" opacity="0.85" />
        <circle cx="32" cy="32" r="26" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.3" />
      </svg>
    );
  }

  if (forma === "sfera") {
    return (
      <svg viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="24" fill={culoare} opacity="0.88" />
        <circle cx="25" cy="24" r="8" fill="#ffffff" opacity="0.35" />
        <circle cx="32" cy="32" r="10" fill="#ffffff" opacity="0.4" />
      </svg>
    );
  }

  if (forma === "cristal") {
    return (
      <svg viewBox="0 0 64 64" fill="none">
        <path d="M32 4 L46 22 L38 60 H26 L18 22 Z" fill={culoare} opacity="0.88" />
        <path d="M32 4 L46 22 L38 60 H26 L18 22 Z" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="2" />
        <path d="M32 4 L32 60" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.6" />
      </svg>
    );
  }

  if (forma === "disc") {
    return (
      <svg viewBox="0 0 64 64" fill="none">
        <ellipse cx="32" cy="22" rx="26" ry="8" fill={culoare} opacity="0.5" />
        <ellipse cx="32" cy="32" rx="22" ry="7" fill={culoare} opacity="0.7" />
        <ellipse cx="32" cy="42" rx="26" ry="8" fill={culoare} opacity="0.5" />
        <circle cx="32" cy="32" r="6" fill="#ffffff" opacity="0.7" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" fill="none">
      <rect x="14" y="8" width="36" height="48" rx="14" fill={culoare} opacity="0.88" />
      <rect x="14" y="8" width="36" height="48" rx="14" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="2" />
      <rect x="29" y="18" width="6" height="28" rx="3" fill="#ffffff" opacity="0.5" />
    </svg>
  );
}

function CardGenerator({ generator, onCumpara }) {
  const [eroare, setEroare] = useState(null);
  const numeMoneda = generator.moneda === "uridium" ? "Uridium" : "Credite";

  const cumpara = () => {
    const rezultat = onCumpara(generator.id);
    if (!rezultat.ok) {
      setEroare(
        `Fonduri insuficiente! Ai doar ${formateazaNumar(rezultat.disponibil)} ${numeMoneda}, iti mai trebuie ${formateazaNumar(rezultat.lipsa)} ${numeMoneda}.`
      );
      return;
    }

    setEroare(null);
  };

  return (
    <div className="magazin-card magazin-card-tun">
      <strong className="magazin-card-titlu">{generator.nume}</strong>
      <div className="magazin-card-icon">
        {generator.imagine ? (
          <img src={generator.imagine} alt={generator.nume} className="magazin-card-icon-img" />
        ) : (
          <IconaGenerator culoare={generator.culoare} forma={generator.forma} />
        )}
      </div>
      <p className="magazin-card-descriere">
        Scut +{formateazaNumar(generator.capacitate)} — Absorbtie {generator.absorbtie}%
      </p>

      <div className="magazin-card-total">
        <span>1 buc</span>
        <span className="magazin-card-total-pret">
          <IconaMoneda tip={generator.moneda} />
          {formateazaNumar(generator.cost)}
        </span>
      </div>

      {eroare && <p className="magazin-card-eroare">{eroare}</p>}

      <button
        type="button"
        className={`magazin-card-buy ${generator.moneda === "uridium" ? "uridium" : ""}`}
        onClick={cumpara}
      >
        <IconaCos />
        Buy
      </button>
    </div>
  );
}

function IconaVitezaGenerator({ culoare = "#5be9ff" }) {
  return (
    <svg viewBox="0 0 64 64" fill="none">
      <path d="M6 38 L34 38 L24 16 L58 30 L30 30 L40 50 Z" fill={culoare} opacity="0.88" />
      <path d="M6 38 L34 38 L24 16 L58 30 L30 30 L40 50 Z" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function CardGeneratorViteza({ generator, onCumpara }) {
  const [eroare, setEroare] = useState(null);
  const numeMoneda = generator.moneda === "uridium" ? "Uridium" : "Credite";

  const cumpara = () => {
    const rezultat = onCumpara(generator.id);
    if (!rezultat.ok) {
      setEroare(
        `Fonduri insuficiente! Ai doar ${formateazaNumar(rezultat.disponibil)} ${numeMoneda}, iti mai trebuie ${formateazaNumar(rezultat.lipsa)} ${numeMoneda}.`
      );
      return;
    }

    setEroare(null);
  };

  return (
    <div className="magazin-card magazin-card-tun">
      <strong className="magazin-card-titlu">{generator.nume}</strong>
      <div className="magazin-card-icon">
        {generator.imagine ? (
          <img src={generator.imagine} alt={generator.nume} className="magazin-card-icon-img" />
        ) : (
          <IconaVitezaGenerator />
        )}
      </div>
      <p className="magazin-card-descriere">Putere viteza +{generator.putere}%</p>

      <div className="magazin-card-total">
        <span>1 buc</span>
        <span className="magazin-card-total-pret">
          <IconaMoneda tip={generator.moneda} />
          {formateazaNumar(generator.cost)}
        </span>
      </div>

      {eroare && <p className="magazin-card-eroare">{eroare}</p>}

      <button
        type="button"
        className={`magazin-card-buy ${generator.moneda === "uridium" ? "uridium" : ""}`}
        onClick={cumpara}
      >
        <IconaCos />
        Buy
      </button>
    </div>
  );
}

const ECHIPAMENTE_EXTRA = [
  {
    id: "cip-slot-6",
    nume: "CIP-MARESTE SLOT EXTRA +6",
    descriere: "Adauga 6 sloturi in plus in sectiunea Abilitati Extra",
    cost: 40000,
    moneda: "uridium",
    imagine: `${import.meta.env.BASE_URL}assets/cip-mareste slot extra +6.png`,
  },
  {
    id: "cip-slot-10",
    nume: "CIP-MARESTE SLOT EXTRA +10",
    descriere: "Adauga 10 sloturi in plus in sectiunea Abilitati Extra",
    cost: 75000,
    moneda: "uridium",
    imagine: `${import.meta.env.BASE_URL}assets/cip-mareste slot extra +10.png`,
  },
  {
    id: "cip-rachete-auto",
    nume: "EXTRA-CIP AUTO LANSARE RACHETE",
    descriere: "Lanseaza rachete automat in lupta",
    cost: 25000,
    moneda: "uridium",
    imagine: `${import.meta.env.BASE_URL}assets/extra-cip auto lansare rachete.png`,
  },
  {
    id: "cip-munitie-auto",
    nume: "CIP-AUTO CUMPARARE MUNITIE",
    descriere: "Cumpara automat orice tip de munitie in functie de setarile tale",
    cost: 25000,
    moneda: "uridium",
    imagine: `${import.meta.env.BASE_URL}assets/cip-auto cumparare munitie.png`,
  },
];

function IconaChip() {
  return (
    <svg viewBox="0 0 64 64" fill="none">
      <rect x="12" y="12" width="40" height="40" rx="6" stroke="#5be9ff" strokeWidth="2.5" />
      <rect x="20" y="20" width="24" height="24" rx="3" fill="#5be9ff" opacity="0.2" stroke="#5be9ff" strokeWidth="1.5" />
      <path d="M22 8v8M32 8v8M42 8v8M22 48v8M32 48v8M42 48v8M8 22h8M8 32h8M8 42h8M48 22h8M48 32h8M48 42h8" stroke="#5be9ff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

function CardEchipamentExtra({ chip, cumparate, onCumpara }) {
  const [eroare, setEroare] = useState(null);
  const cumparat = cumparate.includes(chip.id);

  const cumpara = () => {
    if (cumparat) return;
    const rezultat = onCumpara(chip.id);
    if (!rezultat.ok) {
      setEroare(
        `Fonduri insuficiente! Ai doar ${formateazaNumar(rezultat.disponibil)} Uridium, iti mai trebuie ${formateazaNumar(rezultat.lipsa)} Uridium.`
      );
      return;
    }
    setEroare(null);
  };

  return (
    <div className="magazin-card magazin-card-tun">
      <strong className="magazin-card-titlu">{chip.nume}</strong>
      <div className="magazin-card-icon">
        {chip.imagine ? (
          <img src={chip.imagine} alt={chip.nume} className="magazin-card-icon-img" />
        ) : (
          <IconaChip />
        )}
      </div>
      <p className="magazin-card-descriere">{chip.descriere}</p>
      <div className="magazin-card-total">
        <span>1 buc</span>
        <span className="magazin-card-total-pret">
          <IconaMoneda tip={chip.moneda} />
          {formateazaNumar(chip.cost)}
        </span>
      </div>
      {cumparat && <div className="magazin-card-detinuta">ACTIV</div>}
      {eroare && !cumparat && <p className="magazin-card-eroare">{eroare}</p>}
      <button
        type="button"
        className={`magazin-card-buy uridium ${cumparat ? "cumparat-deja" : ""}`}
        onClick={cumpara}
        disabled={cumparat}
      >
        <IconaCos />
        {cumparat ? "Cumparat" : "Buy"}
      </button>
    </div>
  );
}

function CardArticol({ articol, onCumpara }) {
  const [pachete, setPachete] = useState(0);
  const [eroare, setEroare] = useState(null);

  if (articol.indisponibil) {
    return (
      <div className="magazin-card magazin-card-blocat">
        <strong className="magazin-card-titlu">{articol.titlu}</strong>
        <div className="magazin-card-icon">
          {articol.imagine ? (
            <img src={articol.imagine} alt={articol.titlu} className="magazin-card-icon-img" />
          ) : (
            <IconaProiectil culoare={articol.culoare} />
          )}
        </div>
        <p className="magazin-card-descriere">{articol.descriere}</p>
        <div className="magazin-card-indisponibil">In curand disponibil</div>
      </div>
    );
  }

  const cantitateTotala = articol.cantitate * pachete;
  const costTotal = articol.cost * pachete;
  const numeMoneda = articol.moneda === "uridium" ? "Uridium" : "Credite";

  const creste = () => {
    setEroare(null);
    setPachete((valoare) => valoare + 1);
  };

  const scade = () => {
    setEroare(null);
    setPachete((valoare) => Math.max(0, valoare - 1));
  };

  const cumpara = () => {
    if (pachete <= 0) return;

    const rezultat = onCumpara(articol.id, cantitateTotala, costTotal, articol.moneda);
    if (!rezultat.ok) {
      setEroare(
        `Fonduri insuficiente! Ai doar ${formateazaNumar(rezultat.disponibil)} ${numeMoneda}, iti mai trebuie ${formateazaNumar(rezultat.lipsa)} ${numeMoneda}.`
      );
      return;
    }

    setEroare(null);
    setPachete(0);
  };

  return (
    <div className="magazin-card">
      <strong className="magazin-card-titlu">{articol.titlu}</strong>
      <div className="magazin-card-icon">
        {articol.imagine ? (
          <img src={articol.imagine} alt={articol.titlu} className="magazin-card-icon-img" />
        ) : (
          <IconaProiectil culoare={articol.culoare} />
        )}
      </div>
      <p className="magazin-card-descriere">{articol.descriere}</p>

      <div className="magazin-card-pachet">
        {formateazaNumar(articol.cantitate)} buc = {formateazaNumar(articol.cost)} {numeMoneda}
      </div>

      <div className="magazin-card-counter">
        <button type="button" className="magazin-card-pas" onClick={scade} disabled={pachete === 0}>
          −
        </button>
        <strong>{pachete}</strong>
        <button type="button" className="magazin-card-pas" onClick={creste}>
          +
        </button>
      </div>

      <div className="magazin-card-total">
        <span>{formateazaNumar(cantitateTotala)} buc</span>
        <span className="magazin-card-total-pret">
          <IconaMoneda tip={articol.moneda} />
          {formateazaNumar(costTotal)}
        </span>
      </div>

      {eroare && <p className="magazin-card-eroare">{eroare}</p>}

      <button
        type="button"
        className={`magazin-card-buy ${articol.moneda === "uridium" ? "uridium" : ""}`}
        disabled={pachete === 0}
        onClick={cumpara}
      >
        <IconaCos />
        Buy
      </button>
    </div>
  );
}

function CardTun({ tun, onCumpara }) {
  const [eroare, setEroare] = useState(null);
  const numeMoneda = tun.moneda === "uridium" ? "Uridium" : "Credite";

  const cumpara = () => {
    const rezultat = onCumpara(tun.id);
    if (!rezultat.ok) {
      setEroare(
        `Fonduri insuficiente! Ai doar ${formateazaNumar(rezultat.disponibil)} ${numeMoneda}, iti mai trebuie ${formateazaNumar(rezultat.lipsa)} ${numeMoneda}.`
      );
      return;
    }

    setEroare(null);
  };

  return (
    <div className="magazin-card magazin-card-tun">
      <strong className="magazin-card-titlu">{tun.nume}</strong>
      <div className="magazin-card-icon">
        {tun.imagine ? (
          <img src={tun.imagine} alt={tun.nume} className="magazin-card-icon-img" />
        ) : (
          <IconaTunLaser culoare={tun.culoare} />
        )}
      </div>
      <p className="magazin-card-descriere">Material: {tun.material}</p>

      <div className="magazin-card-damage">Damage: {formateazaNumar(tun.damage)}</div>

      <div className="magazin-card-total">
        <span>1 buc</span>
        <span className="magazin-card-total-pret">
          <IconaMoneda tip={tun.moneda} />
          {formateazaNumar(tun.cost)}
        </span>
      </div>

      {eroare && <p className="magazin-card-eroare">{eroare}</p>}

      <button
        type="button"
        className={`magazin-card-buy ${tun.moneda === "uridium" ? "uridium" : ""}`}
        onClick={cumpara}
      >
        <IconaCos />
        Buy
      </button>
    </div>
  );
}

function IconaNavaMica({ culoare }) {
  return (
    <svg viewBox="0 0 64 64" fill="none">
      <path
        d="M32 6 L50 46 L32 38 L14 46 Z"
        fill={culoare}
        opacity="0.92"
      />
      <path d="M32 6 L50 46 L32 38 L14 46 Z" fill="#ffffff" opacity="0.12" />
      <path d="M32 38 L32 58" stroke={culoare} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function CardNava({ nava, detinuta, onCumpara }) {
  const [eroare, setEroare] = useState(null);
  const numeMoneda = nava.moneda === "uridium" ? "Uridium" : "Credite";

  const cumpara = () => {
    const rezultat = onCumpara(nava.id);
    if (!rezultat.ok) {
      setEroare(
        `Fonduri insuficiente! Ai doar ${formateazaNumar(rezultat.disponibil)} ${numeMoneda}, iti mai trebuie ${formateazaNumar(rezultat.lipsa)} ${numeMoneda}.`
      );
      return;
    }

    setEroare(null);
  };

  return (
    <div className="magazin-card magazin-card-nava">
      <strong className="magazin-card-titlu">{nava.nume}</strong>
      <div className="magazin-card-icon">
        {nava.imagine ? (
          <img src={nava.imagine} alt={nava.nume} className="magazin-card-icon-img" />
        ) : (
          <IconaNavaMica culoare={nava.culoare} />
        )}
      </div>
      <p className="magazin-card-descriere">{nava.descriere}</p>

      {detinuta ? (
        <div className="magazin-card-detinuta">DETINUTA</div>
      ) : (
        <>
          <div className="magazin-card-total">
            <span>1 buc</span>
            <span className="magazin-card-total-pret">
              <IconaMoneda tip={nava.moneda} />
              {formateazaNumar(nava.cost)}
            </span>
          </div>

          {eroare && <p className="magazin-card-eroare">{eroare}</p>}

          <button
            type="button"
            className={`magazin-card-buy ${nava.moneda === "uridium" ? "uridium" : ""}`}
            onClick={cumpara}
          >
            <IconaCos />
            Buy
          </button>
        </>
      )}
    </div>
  );
}

export default function PanouMagazin({
  credite = 0,
  uridium = 0,
  onCumparaMunitie,
  onCumparaTun,
  naveDetinute = [],
  onCumparaNava,
  onCumparaGenerator,
  onCumparaViteza,
  onCumparaExtra,
  extraCumparate = [],
}) {
  const [pozitieButon, setPozitieButon] = useState(POZITIE_BUTON_INITIALA);
  const [pozitiePanou, setPozitiePanou] = useState(POZITIE_PANOU_INITIALA);
  const [dimensiune, setDimensiune] = useState(DIMENSIUNE_INITIALA);
  const [deschis, setDeschis] = useState(false);
  const [tabActiv, setTabActiv] = useState("munitie");

  const tragereButonRef = useRef(null);
  const tragerePanouRef = useRef(null);
  const redimensionareRef = useRef(null);

  const tragereButon = useCallback(
    (eveniment) => {
      eveniment.preventDefault();

      const startX = eveniment.clientX;
      const startY = eveniment.clientY;
      const startPozitie = { ...pozitieButon };
      let sAMiscat = false;

      tragereButonRef.current = { startX, startY, startPozitie };

      const laMiscare = (ev) => {
        const stare = tragereButonRef.current;
        if (!stare) return;

        const dx = ev.clientX - stare.startX;
        const dy = ev.clientY - stare.startY;

        if (Math.abs(dx) > PRAG_CLIC || Math.abs(dy) > PRAG_CLIC) {
          sAMiscat = true;
        }

        setPozitieButon({
          bottom: Math.max(4, stare.startPozitie.bottom - dy),
          right: Math.max(4, stare.startPozitie.right - dx),
        });
      };

      const laRidicare = () => {
        tragereButonRef.current = null;
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

      tragerePanouRef.current = { startX, startY, startPozitie };

      const laMiscare = (ev) => {
        const stare = tragerePanouRef.current;
        if (!stare) return;

        const dx = ev.clientX - stare.startX;
        const dy = ev.clientY - stare.startY;

        setPozitiePanou({
          top: Math.max(4, stare.startPozitie.top + dy),
          left: Math.max(4, stare.startPozitie.left + dx),
        });
      };

      const laRidicare = () => {
        tragerePanouRef.current = null;
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

      redimensionareRef.current = { startX, startY, startDimensiune };

      const laMiscare = (ev) => {
        const stare = redimensionareRef.current;
        if (!stare) return;

        const dx = ev.clientX - stare.startX;
        const dy = ev.clientY - stare.startY;

        setDimensiune({
          latime: clamp(stare.startDimensiune.latime + dx, DIMENSIUNE_MIN.latime, DIMENSIUNE_MAX.latime),
          inaltime: clamp(stare.startDimensiune.inaltime + dy, DIMENSIUNE_MIN.inaltime, DIMENSIUNE_MAX.inaltime),
        });
      };

      const laRidicare = () => {
        redimensionareRef.current = null;
        window.removeEventListener("mousemove", laMiscare);
        window.removeEventListener("mouseup", laRidicare);
      };

      window.addEventListener("mousemove", laMiscare);
      window.addEventListener("mouseup", laRidicare);
    },
    [dimensiune]
  );

  const subtitluTab = useMemo(() => {
    const tab = TABURI.find((item) => item.id === tabActiv);
    return tab ? `${tab.eticheta.toUpperCase()} MARKET` : "MARKET";
  }, [tabActiv]);

  return (
    <>
      <button
        type="button"
        className={`buton-magazin-status ${deschis ? "deschis" : ""}`}
        style={{ bottom: pozitieButon.bottom, right: pozitieButon.right }}
        onMouseDown={tragereButon}
        title="Magazin (trage pentru a muta, clic pentru a deschide)"
      >
        <IconaCos />
      </button>

      {deschis && (
        <div
          className="panou-magazin"
          style={{
            top: pozitiePanou.top,
            left: pozitiePanou.left,
            width: dimensiune.latime,
            height: dimensiune.inaltime,
          }}
        >
          <div className="panou-magazin-antet" onMouseDown={tragerePanou}>
            <span className="panou-magazin-titlu">SHOP</span>
            <button
              type="button"
              className="panou-magazin-inchide"
              onMouseDown={(ev) => ev.stopPropagation()}
              onClick={() => setDeschis(false)}
            >
              ×
            </button>
          </div>

          <div className="panou-magazin-subtitlu">{subtitluTab}</div>

          <div className="panou-magazin-corp">
            <div className="magazin-sidebar">
              {TABURI.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`magazin-tab ${tabActiv === tab.id ? "activ" : ""}`}
                  onClick={() => setTabActiv(tab.id)}
                >
                  <IconaTab tip={tab.forma} />
                  <span>{tab.eticheta}</span>
                </button>
              ))}
            </div>

            <div className="magazin-continut">
              <div className="magazin-moneda-bar">
                <div className="moneda-pill">
                  <IconaMoneda tip="credite" />
                  <span>Credits: {formateazaNumar(credite)}</span>
                  <button type="button" className="moneda-plus">+</button>
                </div>
                <div className="moneda-pill uridium">
                  <IconaMoneda tip="uridium" />
                  <span>Uridium: {formateazaNumar(uridium)}</span>
                  <button type="button" className="moneda-plus">+</button>
                </div>
              </div>

              {tabActiv === "munitie" ? (
                <div className="magazin-grid">
                  {ARTICOLE_MUNITIE.map((articol) => (
                    <CardArticol key={articol.id} articol={articol} onCumpara={onCumparaMunitie} />
                  ))}
                </div>
              ) : tabActiv === "lasere" ? (
                <div className="magazin-grid">
                  {TUNURI_LASER.map((tun) => (
                    <CardTun key={tun.id} tun={tun} onCumpara={onCumparaTun} />
                  ))}
                </div>
              ) : tabActiv === "nave" ? (
                <div className="magazin-grid">
                  {NAVE.map((nava) => (
                    <CardNava
                      key={nava.id}
                      nava={nava}
                      detinuta={naveDetinute.includes(nava.id)}
                      onCumpara={onCumparaNava}
                    />
                  ))}
                </div>
              ) : tabActiv === "scuturi" ? (
                <div className="magazin-grid">
                  {GENERATOARE.map((generator) => (
                    <CardGenerator key={generator.id} generator={generator} onCumpara={onCumparaGenerator} />
                  ))}
                </div>
              ) : tabActiv === "viteza" ? (
                <div className="magazin-grid">
                  {GENERATOARE_VITEZA.map((generator) => (
                    <CardGeneratorViteza key={generator.id} generator={generator} onCumpara={onCumparaViteza} />
                  ))}
                </div>
              ) : tabActiv === "extra" ? (
                <div className="magazin-grid">
                  {ECHIPAMENTE_EXTRA.map((chip) => (
                    <CardEchipamentExtra key={chip.id} chip={chip} cumparate={extraCumparate} onCumpara={onCumparaExtra} />
                  ))}
                </div>
              ) : (
                <div className="magazin-gol">In curand disponibil</div>
              )}
            </div>
          </div>

          <div className="panou-magazin-footer">
            <div className="magazin-legenda">
              <IconaMoneda tip="credite" />
              <div>
                <strong>Credits</strong>
                <span>Moneda standard, obtinuta din misiuni si activitati.</span>
              </div>
            </div>
            <div className="magazin-separator" />
            <div className="magazin-legenda">
              <IconaMoneda tip="uridium" />
              <div>
                <strong>Uridium</strong>
                <span>Moneda premium pentru echipament si itemi puternici.</span>
              </div>
            </div>
            <div className="magazin-cos-mare">
              <IconaCos />
            </div>
          </div>

          <div className="panou-magazin-redimensionare" onMouseDown={pornesteRedimensionare} />
        </div>
      )}
    </>
  );
}
