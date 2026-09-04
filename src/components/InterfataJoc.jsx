import { useCallback, useRef, useState } from "react";

const POZITIE_BUTON_INITIALA = { bottom: 16, left: 16 };
const POZITIE_PANOU_INITIALA = { bottom: 88, left: 16 };
const DIMENSIUNE_INITIALA = { latime: 300, inaltime: 412 };
const DIMENSIUNE_MIN = { latime: 250, inaltime: 260 };
const DIMENSIUNE_MAX = { latime: 460, inaltime: 680 };
const PRAG_CLIC = 5;
const VIATA_MAX = 165000;

function clamp(valoare, min, max) {
  return Math.max(min, Math.min(max, valoare));
}

function formateazaPuncte(numar) {
  return Math.round(numar).toLocaleString("ro-RO");
}

function IconaNava() {
  return (
    <svg viewBox="0 0 32 32" fill="none">
      <path
        d="M16 2 L24 24 L16 19 L8 24 Z"
        fill="currentColor"
        opacity="0.92"
      />
      <path
        d="M16 6 L16 19"
        stroke="#02040b"
        strokeWidth="1.4"
        opacity="0.5"
      />
    </svg>
  );
}

function BaraNava({ eticheta, valoare, max, tip }) {
  const procent = clamp(valoare, 0, 100);
  const puncte = (procent / 100) * max;

  return (
    <div className={`bara-nava bara-nava-${tip}`}>
      <div className="bara-nava-cap">
        <span>
          <i className="bara-nava-marker" />
          {eticheta}
        </span>
        <strong>{formateazaPuncte(puncte)}</strong>
      </div>
      <div className="bara-nava-traseu">
        <div className="bara-nava-umplere" style={{ width: `${procent}%` }} />
      </div>
    </div>
  );
}

export default function InterfataJoc({
  statistici,
  efecteAtmosferice,
  vitezaNava,
  onSchimbaViteza,
}) {
  const [pozitieButon, setPozitieButon] = useState(POZITIE_BUTON_INITIALA);
  const [pozitiePanou, setPozitiePanou] = useState(POZITIE_PANOU_INITIALA);
  const [dimensiune, setDimensiune] = useState(DIMENSIUNE_INITIALA);
  const [deschis, setDeschis] = useState(false);

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
          bottom: Math.max(4, stare.startPozitie.bottom - dy),
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

  const gaz = efecteAtmosferice?.gaz || 0;
  const radiatie = efecteAtmosferice?.radiatie || 0;
  const alerta = statistici.viata < 30 || statistici.scut < 15;

  return (
    <>
      <button
        type="button"
        className={`buton-nava-status ${deschis ? "deschis" : ""} ${alerta && !deschis ? "alerta" : ""}`}
        style={{ bottom: pozitieButon.bottom, left: pozitieButon.left }}
        onMouseDown={tragereButon}
        title="Stare nava (trage pentru a muta, clic pentru a deschide)"
      >
        <IconaNava />
      </button>

      {deschis && (
        <div
          className="panou-nava-elegant"
          style={{
            bottom: pozitiePanou.bottom,
            left: pozitiePanou.left,
            width: dimensiune.latime,
            height: dimensiune.inaltime,
          }}
        >
          <div className="panou-nava-antet" onMouseDown={tragerePanou}>
            <div className="panou-nava-titlu">
              <span className="panou-nava-icon">
                <IconaNava />
              </span>
              <div className="panou-nava-titlu-text">
                <strong>ORION-01</strong>
                <span>Nava de lupta</span>
              </div>
            </div>
            <button
              type="button"
              className="panou-nava-inchide"
              onMouseDown={(ev) => ev.stopPropagation()}
              onClick={() => setDeschis(false)}
            >
              ×
            </button>
          </div>

          <div className="panou-nava-corp">
            <div className="panou-nava-bare">
              <BaraNava eticheta="HP" valoare={statistici.viata} max={VIATA_MAX} tip="hp" />
              <BaraNava eticheta="Scut" valoare={statistici.scut} max={statistici.scutMax || 0} tip="scut" />
            </div>

            <div className="panou-nava-sectiune">
              <div className="panou-nava-sectiune-titlu">
                <span>Configuratie viteza</span>
                <strong>x{vitezaNava || 1}</strong>
              </div>
              <div className="viteza-segment">
                <button
                  type="button"
                  className={`viteza-opt ${vitezaNava === 1 ? "activ" : ""}`}
                  onClick={() => onSchimbaViteza?.(1)}
                >
                  Viteza 1
                </button>
                <button
                  type="button"
                  className={`viteza-opt ${vitezaNava === 2 ? "activ" : ""}`}
                  onClick={() => onSchimbaViteza?.(2)}
                >
                  Viteza 2
                </button>
              </div>
            </div>
          </div>

          <div className="panou-nava-redimensionare" onMouseDown={pornesteRedimensionare} />
        </div>
      )}

      {gaz > 0.04 && (
        <div className="efect-nor-gaz" style={{ opacity: Math.min(0.55, gaz * 0.55) }} />
      )}

      {radiatie > 0.02 && (
        <>
          <div className="efect-radiatie" style={{ opacity: Math.min(0.62, radiatie * 0.62) }} />
          {radiatie > 0.45 && (
            <div className="alerta-radiatie" style={{ opacity: Math.min(1, (radiatie - 0.45) * 2.2) }}>
              ATENTIE: ZONA DE RADIATII — REVENITI IN SECTORUL SIGUR
            </div>
          )}
        </>
      )}
    </>
  );
}
