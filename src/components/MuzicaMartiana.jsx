import { useCallback, useEffect, useRef, useState } from "react";

const PISTE = {
  standard: {
    explorare: "assets/coloana-standard-explorare.wav",
    lupta: "assets/coloana-standard-lupta.wav",
    eticheta: "MMO",
  },
  aether: {
    explorare: "assets/coloana-aether-explorare.wav",
    lupta: "assets/coloana-aether-lupta.wav",
    eticheta: "AETH",
  },
  noctis: {
    explorare: "assets/coloana-noctis-explorare.wav",
    lupta: "assets/coloana-noctis-lupta.wav",
    eticheta: "NOCT",
  },
  kharon: {
    explorare: "assets/coloana-kharon-explorare.wav",
    lupta: "assets/coloana-kharon-lupta.wav",
    eticheta: "KHAR",
  },
};

const VOLUM_EXPLORARE = 0.22;
const VOLUM_LUPTA = 0.28;
const DURATA_TRANZITIE = 850;
const DURATA_SCADERE_PORTAL = 100;
const FACTOR_VOLUM_PORTAL = 0.025;
const VERSIUNE_AUDIO = "original-v8-cf976d4";

function caleAudio(fisier) {
  return `${import.meta.env.BASE_URL}${fisier}?v=${VERSIUNE_AUDIO}`;
}

export default function MuzicaMartiana({
  hartaActiva = "standard",
  luptaActiva = false,
  portalActiv = false,
}) {
  const hartaMuzicala = ["flota", "verdant", "neridia", "frontiera15"].includes(hartaActiva)
    ? "standard"
    : hartaActiva;
  const audioRef = useRef({});
  const hartaRef = useRef(hartaMuzicala);
  const luptaRef = useRef(luptaActiva);
  const portalRef = useRef(portalActiv);
  const pornitaRef = useRef(false);
  const pornireInCursRef = useRef(false);
  const opritaRef = useRef(false);
  const animatieRef = useRef(0);
  const [oprita, setOprita] = useState(false);

  hartaRef.current = hartaMuzicala;
  luptaRef.current = luptaActiva;
  portalRef.current = portalActiv;

  const volumeTinta = useCallback((esteLupta, estePortalActiv = false) => {
    const factor = estePortalActiv ? FACTOR_VOLUM_PORTAL : 1;
    return {
      explorare: (esteLupta ? 0.045 : VOLUM_EXPLORARE) * factor,
      lupta: (esteLupta ? VOLUM_LUPTA : 0) * factor,
    };
  }, []);

  const porneste = useCallback(async () => {
    if (pornitaRef.current || pornireInCursRef.current || opritaRef.current) return;
    const pereche = audioRef.current[hartaRef.current];
    if (!pereche) return;

    pornireInCursRef.current = true;
    const tinta = volumeTinta(luptaRef.current, portalRef.current);
    pereche.explorare.volume = tinta.explorare;
    pereche.lupta.volume = tinta.lupta;

    try {
      const rezultate = await Promise.allSettled([
        pereche.explorare.play(),
        pereche.lupta.play(),
      ]);
      pornitaRef.current = rezultate.some((rezultat) => rezultat.status === "fulfilled");
    } finally {
      pornireInCursRef.current = false;
    }
  }, [volumeTinta]);

  useEffect(() => {
    const colectie = {};
    Object.entries(PISTE).forEach(([harta, piste]) => {
      const explorare = new Audio(caleAudio(piste.explorare));
      const lupta = new Audio(caleAudio(piste.lupta));
      explorare.loop = true;
      lupta.loop = true;
      explorare.preload = harta === hartaRef.current ? "auto" : "metadata";
      lupta.preload = harta === hartaRef.current ? "auto" : "metadata";
      explorare.volume = 0;
      lupta.volume = 0;
      colectie[harta] = { explorare, lupta };
    });
    audioRef.current = colectie;

    const laInteractiune = () => porneste();
    window.addEventListener("pointerdown", laInteractiune);
    window.addEventListener("keydown", laInteractiune);

    return () => {
      window.removeEventListener("pointerdown", laInteractiune);
      window.removeEventListener("keydown", laInteractiune);
      cancelAnimationFrame(animatieRef.current);
      Object.values(colectie).forEach((pereche) => {
        pereche.explorare.pause();
        pereche.lupta.pause();
        pereche.explorare.src = "";
        pereche.lupta.src = "";
      });
    };
  }, [porneste]);

  useEffect(() => {
    cancelAnimationFrame(animatieRef.current);
    Object.entries(audioRef.current).forEach(([harta, pereche]) => {
      if (harta === hartaMuzicala) return;
      pereche.explorare.pause();
      pereche.lupta.pause();
      pereche.explorare.volume = 0;
      pereche.lupta.volume = 0;
    });

    const pereche = audioRef.current[hartaMuzicala];
    if (!pereche || !pornitaRef.current || opritaRef.current) return;
    const tinta = volumeTinta(luptaActiva, portalActiv);
    pereche.explorare.volume = tinta.explorare;
    pereche.lupta.volume = tinta.lupta;
    Promise.allSettled([pereche.explorare.play(), pereche.lupta.play()]);
  }, [hartaMuzicala, volumeTinta]);

  useEffect(() => {
    if (!pornitaRef.current || opritaRef.current) return;
    const pereche = audioRef.current[hartaMuzicala];
    if (!pereche) return;

    cancelAnimationFrame(animatieRef.current);
    const inceput = performance.now();
    const volumExplorareStart = pereche.explorare.volume;
    const volumLuptaStart = pereche.lupta.volume;
    const tinta = volumeTinta(luptaActiva, portalActiv);
    const durataTranzitie = portalActiv
      ? DURATA_SCADERE_PORTAL
      : DURATA_TRANZITIE;

    const tranzitie = (acum) => {
      const progres = Math.min(1, (acum - inceput) / durataTranzitie);
      const lin = progres * progres * (3 - 2 * progres);
      pereche.explorare.volume = volumExplorareStart + (tinta.explorare - volumExplorareStart) * lin;
      pereche.lupta.volume = volumLuptaStart + (tinta.lupta - volumLuptaStart) * lin;
      if (progres < 1) animatieRef.current = requestAnimationFrame(tranzitie);
    };

    animatieRef.current = requestAnimationFrame(tranzitie);
    return () => cancelAnimationFrame(animatieRef.current);
  }, [hartaMuzicala, luptaActiva, portalActiv, volumeTinta]);

  const comutaMuzica = useCallback(async (event) => {
    event.stopPropagation();
    const vaFiOprita = !opritaRef.current;
    opritaRef.current = vaFiOprita;
    setOprita(vaFiOprita);

    if (vaFiOprita) {
      cancelAnimationFrame(animatieRef.current);
      Object.values(audioRef.current).forEach((pereche) => {
        pereche.explorare.pause();
        pereche.lupta.pause();
      });
      return;
    }

    pornitaRef.current = false;
    await porneste();
  }, [porneste]);

  const numeHarta = PISTE[hartaMuzicala]?.eticheta ?? "OST";

  return (
    <button
      type="button"
      className={`buton-muzica-martiana ${oprita ? "oprita" : ""}`}
      onClick={comutaMuzica}
      title={oprita ? "Porneste coloana sonora" : `Opreste muzica ${numeHarta}`}
      aria-label={oprita ? "Porneste coloana sonora" : `Opreste muzica ${numeHarta}`}
    >
      <span aria-hidden="true">{oprita ? "♪×" : "♫"}</span>
      <small>{oprita ? "OFF" : numeHarta}</small>
    </button>
  );
}
