import { useCallback, useRef, useState } from "react";

const POZITIE_BUTON_INITIALA = { top: 64, left: 16 };
const POZITIE_PANOU_INITIALA = { top: 122, left: 16 };
const DIMENSIUNE_INITIALA = { latime: 250, inaltime: 312 };
const DIMENSIUNE_MIN = { latime: 210, inaltime: 220 };
const DIMENSIUNE_MAX = { latime: 380, inaltime: 540 };
const PRAG_CLIC = 5;

function clamp(valoare, min, max) {
  return Math.max(min, Math.min(max, valoare));
}

function formateazaNumar(numar) {
  return Math.round(numar).toLocaleString("ro-RO");
}

function IconaProfil() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8.4" r="3.6" fill="currentColor" opacity="0.92" />
      <path d="M4.5 19.5c0-3.6 3.4-6.2 7.5-6.2s7.5 2.6 7.5 6.2" fill="currentColor" opacity="0.92" />
    </svg>
  );
}

function IconaResursa({ tip }) {
  if (tip === "credite") {
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
        <path d="M12 6.6v1.1M12 16.3v1.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }

  if (tip === "uridium") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M12 2 L19 9 L12 22 L5 9 Z" fill="currentColor" opacity="0.85" />
        <path d="M12 2 L19 9 L12 13 L5 9 Z" fill="currentColor" opacity="0.45" />
        <path d="M12 2 L12 13 M5 9 L19 9" stroke="#02040b" strokeWidth="0.6" opacity="0.35" />
      </svg>
    );
  }

  if (tip === "onoare") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M8 2 L10.2 9 L7 9 Z" fill="currentColor" opacity="0.5" />
        <path d="M16 2 L13.8 9 L17 9 Z" fill="currentColor" opacity="0.5" />
        <circle cx="12" cy="14" r="6.3" fill="currentColor" opacity="0.2" />
        <circle cx="12" cy="14" r="6.3" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M12 10.6 L13.2 13 L15.9 13.4 L14 15.3 L14.4 18 L12 16.7 L9.6 18 L10 15.3 L8.1 13.4 L10.8 13 Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (tip === "experienta") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2 L14.7 8.6 L22 9.3 L16.6 14.1 L18.2 21 L12 17.3 L5.8 21 L7.4 14.1 L2 9.3 L9.3 8.6 Z"
          fill="currentColor"
          opacity="0.92"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M3.4 10c0-3.4 2.7-6.2 6.1-6.2h5c3.4 0 6.1 2.8 6.1 6.2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="3" y="10" width="18" height="9.4" rx="1.6" fill="currentColor" opacity="0.88" />
      <rect x="9.8" y="11.6" width="4.4" height="3.4" rx="0.7" fill="#02040b" opacity="0.55" />
    </svg>
  );
}

const RESURSE = [
  { id: "credite", eticheta: "Credite", culoare: "#ffd35a", forma: "credite" },
  { id: "uridium", eticheta: "Uridium", culoare: "#5be3ff", forma: "uridium" },
  { id: "onoare", eticheta: "Onoare", culoare: "#ff6a4d", forma: "onoare" },
  { id: "experienta", eticheta: "Experienta", culoare: "#b07dff", forma: "experienta" },
  { id: "jackpot", eticheta: "Jackpot", culoare: "#52ff85", forma: "jackpot" },
];

export default function PanouResurse({ credite, uridium, onoare, experienta, jackpot }) {
  const [pozitieButon, setPozitieButon] = useState(POZITIE_BUTON_INITIALA);
  const [pozitiePanou, setPozitiePanou] = useState(POZITIE_PANOU_INITIALA);
  const [dimensiune, setDimensiune] = useState(DIMENSIUNE_INITIALA);
  const [deschis, setDeschis] = useState(false);

  const valori = { credite, uridium, onoare, experienta, jackpot };

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
          top: Math.max(4, stare.startPozitie.top + dy),
          left: Math.max(4, stare.startPozitie.left + dx),
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

  return (
    <>
      <button
        type="button"
        className={`buton-resurse-status ${deschis ? "deschis" : ""}`}
        style={{ top: pozitieButon.top, left: pozitieButon.left }}
        onMouseDown={tragereButon}
        title="Profil (trage pentru a muta, clic pentru a deschide)"
      >
        <IconaProfil />
      </button>

      {deschis && (
        <div
          className="panou-resurse"
          style={{
            top: pozitiePanou.top,
            left: pozitiePanou.left,
            width: dimensiune.latime,
            height: dimensiune.inaltime,
          }}
        >
          <div className="panou-resurse-antet" onMouseDown={tragerePanou}>
            <span className="panou-resurse-icon">
              <IconaProfil />
            </span>
            <span>Profil</span>
            <button
              type="button"
              className="panou-resurse-buton"
              onMouseDown={(ev) => ev.stopPropagation()}
              onClick={() => setDeschis(false)}
            >
              ×
            </button>
          </div>

          <div className="panou-resurse-corp">
            {RESURSE.map((resursa) => (
              <div key={resursa.id} className="resursa-rand">
                <span className="resursa-icon" style={{ "--c": resursa.culoare }}>
                  <IconaResursa tip={resursa.forma} />
                </span>
                <span className="resursa-eticheta">{resursa.eticheta}</span>
                <strong className="resursa-valoare">{formateazaNumar(valori[resursa.id])}</strong>
              </div>
            ))}
          </div>

          <div className="panou-resurse-redimensionare" onMouseDown={pornesteRedimensionare} />
        </div>
      )}
    </>
  );
}
