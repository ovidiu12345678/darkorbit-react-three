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
};

const VOLUM_EXPLORARE = 0.22;
const VOLUM_LUPTA = 0.28;
const DURATA_TRANZITIE = 850;

export default function MuzicaMartiana({ hartaActiva = "standard", luptaActiva = false }) {
  const audioRef = useRef({});
  const hartaRef = useRef(hartaActiva);
  const luptaRef = useRef(luptaActiva);
  const pornitaRef = useRef(false);
  const pornireInCursRef = useRef(false);
  const opritaRef = useRef(false);
  const animatieRef = useRef(0);
  const [oprita, setOprita] = useState(false);

  hartaRef.current = hartaActiva;
  luptaRef.current = luptaActiva;

  const volumeTinta = useCallback((esteLupta) => ({
    explorare: esteLupta ? 0.045 : VOLUM_EXPLORARE,
    lupta: esteLupta ? VOLUM_LUPTA : 0,
  }), []);

  const porneste = useCallback(async () => {
    if (pornitaRef.current || pornireInCursRef.current || opritaRef.current) return;
    const pereche = audioRef.current[hartaRef.current];
    if (!pereche) return;

    pornireInCursRef.current = true;
    const tinta = volumeTinta(luptaRef.current);
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
      const explorare = new Audio(`${import.meta.env.BASE_URL}${piste.explorare}`);
      const lupta = new Audio(`${import.meta.env.BASE_URL}${piste.lupta}`);
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
      if (harta === hartaActiva) return;
      pereche.explorare.pause();
      pereche.lupta.pause();
      pereche.explorare.volume = 0;
      pereche.lupta.volume = 0;
    });

    const pereche = audioRef.current[hartaActiva];
    if (!pereche || !pornitaRef.current || opritaRef.current) return;
    const tinta = volumeTinta(luptaActiva);
    pereche.explorare.volume = tinta.explorare;
    pereche.lupta.volume = tinta.lupta;
    Promise.allSettled([pereche.explorare.play(), pereche.lupta.play()]);
  }, [hartaActiva, volumeTinta]);

  useEffect(() => {
    if (!pornitaRef.current || opritaRef.current) return;
    const pereche = audioRef.current[hartaActiva];
    if (!pereche) return;

    cancelAnimationFrame(animatieRef.current);
    const inceput = performance.now();
    const volumExplorareStart = pereche.explorare.volume;
    const volumLuptaStart = pereche.lupta.volume;
    const tinta = volumeTinta(luptaActiva);

    const tranzitie = (acum) => {
      const progres = Math.min(1, (acum - inceput) / DURATA_TRANZITIE);
      const lin = progres * progres * (3 - 2 * progres);
      pereche.explorare.volume = volumExplorareStart + (tinta.explorare - volumExplorareStart) * lin;
      pereche.lupta.volume = volumLuptaStart + (tinta.lupta - volumLuptaStart) * lin;
      if (progres < 1) animatieRef.current = requestAnimationFrame(tranzitie);
    };

    animatieRef.current = requestAnimationFrame(tranzitie);
    return () => cancelAnimationFrame(animatieRef.current);
  }, [hartaActiva, luptaActiva, volumeTinta]);

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

  const numeHarta = PISTE[hartaActiva]?.eticheta ?? "OST";

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
