import { useEffect, useState } from "react";

const CALITATI = [
  { id: "scazuta", nume: "Scăzută", descriere: "Performanță maximă" },
  { id: "medie", nume: "Medie", descriere: "Echilibru bun" },
  { id: "ridicata", nume: "Ridicată", descriere: "Claritate și lumină" },
  { id: "ultra", nume: "Ultra", descriere: "Detalii cinematice" },
];

function ControlVolum({ eticheta, valoare, onChange, dezactivat = false }) {
  return (
    <label className={`setari-control-volum ${dezactivat ? "dezactivat" : ""}`}>
      <span><strong>{eticheta}</strong><b>{valoare}%</b></span>
      <input type="range" min="0" max="100" step="1" value={valoare} disabled={dezactivat}
        onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

export default function PanouSetari({ setari, onSchimba }) {
  const [deschis, setDeschis] = useState(false);
  const [sectiune, setSectiune] = useState("sunet");

  useEffect(() => {
    if (!deschis) return undefined;
    const laTasta = (event) => { if (event.key === "Escape") setDeschis(false); };
    window.addEventListener("keydown", laTasta);
    return () => window.removeEventListener("keydown", laTasta);
  }, [deschis]);

  const schimba = (camp, valoare) => onSchimba((vechi) => ({ ...vechi, [camp]: valoare }));

  return (
    <>
      <button type="button" className="buton-setari-joc" onClick={() => setDeschis(true)}
        title="Setări sunet și display" aria-label="Deschide setările">
        <span aria-hidden="true">⚙</span><small>SETĂRI</small>
      </button>

      {deschis && (
        <div className="setari-fundal" onPointerDown={(event) => {
          if (event.target === event.currentTarget) setDeschis(false);
        }}>
          <section className="setari-panou" role="dialog" aria-modal="true" aria-label="Setări joc"
            onPointerDown={(event) => event.stopPropagation()}>
            <header className="setari-antet">
              <div><small>SISTEMUL NAVEI</small><h2>Setări</h2></div>
              <button type="button" onClick={() => setDeschis(false)} aria-label="Închide setările">×</button>
            </header>

            <nav className="setari-file">
              <button type="button" className={sectiune === "sunet" ? "activ" : ""} onClick={() => setSectiune("sunet")}>Sunet</button>
              <button type="button" className={sectiune === "display" ? "activ" : ""} onClick={() => setSectiune("display")}>Display</button>
            </nav>

            {sectiune === "sunet" ? (
              <div className="setari-continut">
                <div className="setari-rand-comutator">
                  <div><strong>Motorul navei</strong><small>Sunet spațial dinamic, legat de accelerație</small></div>
                  <button type="button" className={`setari-comutator ${setari.motorActiv ? "activ" : ""}`}
                    onClick={() => schimba("motorActiv", !setari.motorActiv)} aria-pressed={setari.motorActiv}>
                    <span />{setari.motorActiv ? "PORNIT" : "OPRIT"}
                  </button>
                </div>
                <ControlVolum eticheta="Volum motor" valoare={setari.volumMotor}
                  dezactivat={!setari.motorActiv} onChange={(valoare) => schimba("volumMotor", valoare)} />
                <ControlVolum eticheta="Volum muzică" valoare={setari.volumMuzica}
                  onChange={(valoare) => schimba("volumMuzica", valoare)} />
                <p className="setari-nota">Motorul reacționează la deplasarea navei; muzica de luptă și efectul portalului își păstrează tranzițiile.</p>
              </div>
            ) : (
              <div className="setari-continut">
                <div className="setari-calitati">
                  {CALITATI.map((calitate) => (
                    <button key={calitate.id} type="button" className={setari.calitate === calitate.id ? "activ" : ""}
                      onClick={() => schimba("calitate", calitate.id)}>
                      <span>{calitate.nume}</span><small>{calitate.descriere}</small>
                    </button>
                  ))}
                </div>
                <div className="setari-detalii-calitate">
                  <span>Rezoluție adaptivă</span><span>Antialiasing</span><span>Lumină cinematică</span><span>Efecte luminoase</span>
                </div>
                <p className="setari-nota">Ultra mărește rezoluția internă, umbrele și profunzimea luminii. Poate consuma mai multe resurse pe mobil.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
