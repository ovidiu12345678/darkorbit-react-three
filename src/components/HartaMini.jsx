import { useCallback, useMemo, useRef, useState } from "react";

const POZITIE_INITIALA = { top: 16, right: 16 };
const DIMENSIUNE_INITIALA = { latime: 300, inaltime: 220 };
const DIMENSIUNE_MIN = { latime: 200, inaltime: 150 };
const DIMENSIUNE_MAX = { latime: 640, inaltime: 480 };

function clamp(valoare, min, max) {
  return Math.max(min, Math.min(max, valoare));
}

export default function HartaMini({
  marimeHarta,
  pozitieJucator,
  tintaJucator,
  inamici,
  onAlegeTinta,
  pozitieStatie,
  pozitieHangar,
  pozitieAndocareHangar,
}) {
  const continutRef = useRef(null);

  const [pozitiePanou, setPozitiePanou] = useState(POZITIE_INITIALA);
  const [dimensiune, setDimensiune] = useState(DIMENSIUNE_INITIALA);
  const [restrans, setRestrans] = useState(false);

  const tragereRef = useRef(null);
  const redimensionareRef = useRef(null);

  const limitaHarta = marimeHarta / 2 - 4.5;

  const lumeLaProcent = useCallback(
    (x, z) => {
      const procentX = clamp(((x + limitaHarta) / (limitaHarta * 2)) * 100, 0, 100);
      const procentZ = clamp(((z + limitaHarta) / (limitaHarta * 2)) * 100, 0, 100);
      return { left: procentX, top: procentZ };
    },
    [limitaHarta]
  );

  const pornesteTragerePanou = useCallback(
    (eveniment) => {
      eveniment.stopPropagation();
      eveniment.preventDefault();

      const startX = eveniment.clientX;
      const startY = eveniment.clientY;
      const startPozitie = { ...pozitiePanou };

      tragereRef.current = { startX, startY, startPozitie };

      const laMiscare = (ev) => {
        const stare = tragereRef.current;
        if (!stare) return;

        const dx = ev.clientX - stare.startX;
        const dy = ev.clientY - stare.startY;

        setPozitiePanou({
          top: Math.max(4, stare.startPozitie.top + dy),
          right: Math.max(4, stare.startPozitie.right - dx),
        });
      };

      const laRidicare = () => {
        tragereRef.current = null;
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

  const laClickHarta = useCallback(
    (eveniment) => {
      eveniment.stopPropagation();
      const cadru = continutRef.current;
      if (!cadru) return;

      const rect = cadru.getBoundingClientRect();
      const procentX = clamp((eveniment.clientX - rect.left) / rect.width, 0, 1);
      const procentZ = clamp((eveniment.clientY - rect.top) / rect.height, 0, 1);

      const x = procentX * (limitaHarta * 2) - limitaHarta;
      const z = procentZ * (limitaHarta * 2) - limitaHarta;

      onAlegeTinta?.({ x, z });
    },
    [limitaHarta, onAlegeTinta]
  );

  const pozitiiInamici = useMemo(() => {
    return (inamici || [])
      .filter((inamic) => inamic.activ)
      .map((inamic) => ({
        id: inamic.id,
        ...lumeLaProcent(inamic.pozitie[0], inamic.pozitie[2]),
      }));
  }, [inamici, lumeLaProcent]);

  const pozitieNava = lumeLaProcent(pozitieJucator[0], pozitieJucator[2]);
  const pozitieTinta = tintaJucator ? lumeLaProcent(tintaJucator[0], tintaJucator[2]) : null;

  const pozitieStatieMini = pozitieStatie ? lumeLaProcent(pozitieStatie[0], pozitieStatie[2]) : null;
  const pozitieHangarMini = pozitieHangar ? lumeLaProcent(pozitieHangar[0], pozitieHangar[2]) : null;

  const laClickRepere = useCallback(
    (eveniment, pozitie) => {
      eveniment.stopPropagation();
      onAlegeTinta?.({ x: pozitie[0], z: pozitie[2] });
    },
    [onAlegeTinta]
  );

  return (
    <div
      className="harta-mini"
      style={{
        top: pozitiePanou.top,
        right: pozitiePanou.right,
        width: dimensiune.latime,
        height: restrans ? "auto" : dimensiune.inaltime,
      }}
    >
      <div className="harta-mini-antet" onMouseDown={pornesteTragerePanou}>
        <span>Harta mini</span>
        {tintaJucator && (
          <span className="harta-mini-ruta">
            Ruta: {tintaJucator[0].toFixed(0)} / {tintaJucator[2].toFixed(0)}
          </span>
        )}
        <button
          type="button"
          className="harta-mini-buton"
          onMouseDown={(ev) => ev.stopPropagation()}
          onClick={() => setRestrans((v) => !v)}
        >
          {restrans ? "+" : "−"}
        </button>
      </div>

      {!restrans && (
        <div
          ref={continutRef}
          className="harta-mini-continut"
          onClick={laClickHarta}
          style={{ backgroundImage: "url(/assets/harta-spatiala-fundal-hi.jpg)" }}
        >
          <div className="harta-mini-axa harta-mini-axa-x" />
          <div className="harta-mini-axa harta-mini-axa-y" />

          <span className="harta-mini-coord harta-mini-coord-stanga">
            {(-limitaHarta).toFixed(0)}
          </span>
          <span className="harta-mini-coord harta-mini-coord-dreapta">
            {limitaHarta.toFixed(0)}
          </span>
          <span className="harta-mini-coord harta-mini-coord-sus">
            {(-limitaHarta).toFixed(0)}
          </span>
          <span className="harta-mini-coord harta-mini-coord-jos">
            {limitaHarta.toFixed(0)}
          </span>

          {pozitieStatieMini && (
            <span
              className="harta-mini-marker harta-mini-statie"
              style={{ left: `${pozitieStatieMini.left}%`, top: `${pozitieStatieMini.top}%` }}
              title="Statie"
              onMouseDown={(eveniment) => eveniment.stopPropagation()}
              onClick={(eveniment) => laClickRepere(eveniment, pozitieStatie)}
            />
          )}

          {pozitieHangarMini && (
            <span
              className="harta-mini-marker harta-mini-hangar"
              style={{ left: `${pozitieHangarMini.left}%`, top: `${pozitieHangarMini.top}%` }}
              title="Hangar"
              onMouseDown={(eveniment) => eveniment.stopPropagation()}
              onClick={(eveniment) => laClickRepere(eveniment, pozitieAndocareHangar || pozitieHangar)}
            />
          )}

          {pozitiiInamici.map((inamic) => (
            <span
              key={inamic.id}
              className="harta-mini-marker harta-mini-inamic"
              style={{ left: `${inamic.left}%`, top: `${inamic.top}%` }}
            />
          ))}

          {pozitieTinta && (
            <span
              className="harta-mini-marker harta-mini-tinta"
              style={{ left: `${pozitieTinta.left}%`, top: `${pozitieTinta.top}%` }}
            />
          )}

          <span
            className="harta-mini-marker harta-mini-jucator"
            style={{ left: `${pozitieNava.left}%`, top: `${pozitieNava.top}%` }}
          />

          <div className="harta-mini-redimensionare" onMouseDown={pornesteRedimensionare} />
        </div>
      )}
    </div>
  );
}
