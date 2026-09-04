import { useEffect, useState } from "react";

const DURATA_AFISARE = 3200;

function formateazaNumar(numar) {
  return Math.round(numar).toLocaleString("ro-RO");
}

export default function NotificareRecompensa({ recompensa }) {
  const [cozi, setCozi] = useState([]);

  useEffect(() => {
    if (!recompensa) return;

    setCozi((lista) => [...lista, recompensa]);

    const timer = setTimeout(() => {
      setCozi((lista) => lista.filter((item) => item.id !== recompensa.id));
    }, DURATA_AFISARE);

    return () => clearTimeout(timer);
  }, [recompensa]);

  if (cozi.length === 0) return null;

  return (
    <div className="recompense-container">
      {cozi.map((item) => (
        <div key={item.id} className="recompensa-toast">
          <strong>Inamic distrus</strong>
          <div className="recompensa-linii">
            <span className="recompensa-credite">+{formateazaNumar(item.credite)} Credite</span>
            <span className="recompensa-uridium">+{formateazaNumar(item.uridium)} Uridium</span>
            <span className="recompensa-onoare">+{formateazaNumar(item.onoare)} Onoare</span>
            <span className="recompensa-experienta">+{formateazaNumar(item.experienta)} Experienta</span>
          </div>
        </div>
      ))}
    </div>
  );
}
