import { useCallback, useEffect, useRef, useState } from "react";

const VOLUM_EXPLORARE = 0.24;
const VOLUM_LUPTA = 0.3;
const DURATA_TRANZITIE = 1400;

export default function MuzicaMartiana({ luptaActiva = false }) {
  const explorareRef = useRef(null);
  const luptaRef = useRef(null);
  const pornitaRef = useRef(false);
  const pornireInCursRef = useRef(false);
  const opritaRef = useRef(false);
  const animatieRef = useRef(0);
  const [oprita, setOprita] = useState(false);

  const porneste = useCallback(async () => {
    if (pornitaRef.current || pornireInCursRef.current || opritaRef.current) return;
    const explorare = explorareRef.current;
    const lupta = luptaRef.current;
    if (!explorare || !lupta) return;

    pornireInCursRef.current = true;
    try {
      await Promise.all([explorare.play(), lupta.play()]);
      pornitaRef.current = true;
    } catch {
      // Browserul va permite redarea la urmatoarea interactiune a jucatorului.
    } finally {
      pornireInCursRef.current = false;
    }
  }, []);

  useEffect(() => {
    const explorare = new Audio(`${import.meta.env.BASE_URL}assets/coloana-martiana-explorare.wav`);
    const lupta = new Audio(`${import.meta.env.BASE_URL}assets/coloana-martiana-lupta.wav`);
    explorare.loop = true;
    lupta.loop = true;
    explorare.preload = "auto";
    lupta.preload = "auto";
    explorare.volume = VOLUM_EXPLORARE;
    lupta.volume = 0;
    explorareRef.current = explorare;
    luptaRef.current = lupta;

    const laInteractiune = () => porneste();
    window.addEventListener("pointerdown", laInteractiune);
    window.addEventListener("keydown", laInteractiune);

    return () => {
      window.removeEventListener("pointerdown", laInteractiune);
      window.removeEventListener("keydown", laInteractiune);
      cancelAnimationFrame(animatieRef.current);
      explorare.pause();
      lupta.pause();
      explorare.src = "";
      lupta.src = "";
    };
  }, [porneste]);

  useEffect(() => {
    if (!pornitaRef.current || opritaRef.current) return;
    const explorare = explorareRef.current;
    const lupta = luptaRef.current;
    if (!explorare || !lupta) return;

    cancelAnimationFrame(animatieRef.current);
    const inceput = performance.now();
    const volumExplorareStart = explorare.volume;
    const volumLuptaStart = lupta.volume;
    const volumExplorareTinta = luptaActiva ? 0.065 : VOLUM_EXPLORARE;
    const volumLuptaTinta = luptaActiva ? VOLUM_LUPTA : 0;

    const tranzitie = (acum) => {
      const progres = Math.min(1, (acum - inceput) / DURATA_TRANZITIE);
      const lin = progres * progres * (3 - 2 * progres);
      explorare.volume = volumExplorareStart + (volumExplorareTinta - volumExplorareStart) * lin;
      lupta.volume = volumLuptaStart + (volumLuptaTinta - volumLuptaStart) * lin;
      if (progres < 1) animatieRef.current = requestAnimationFrame(tranzitie);
    };

    animatieRef.current = requestAnimationFrame(tranzitie);
    return () => cancelAnimationFrame(animatieRef.current);
  }, [luptaActiva]);

  const comutaMuzica = useCallback(async (event) => {
    event.stopPropagation();
    const vaFiOprita = !opritaRef.current;
    opritaRef.current = vaFiOprita;
    setOprita(vaFiOprita);

    const explorare = explorareRef.current;
    const lupta = luptaRef.current;
    if (!explorare || !lupta) return;

    if (vaFiOprita) {
      cancelAnimationFrame(animatieRef.current);
      explorare.pause();
      lupta.pause();
      return;
    }

    pornitaRef.current = false;
    await porneste();
    explorare.volume = luptaActiva ? 0.065 : VOLUM_EXPLORARE;
    lupta.volume = luptaActiva ? VOLUM_LUPTA : 0;
  }, [luptaActiva, porneste]);

  return (
    <button
      type="button"
      className={`buton-muzica-martiana ${oprita ? "oprita" : ""}`}
      onClick={comutaMuzica}
      title={oprita ? "Porneste muzica martiana" : "Opreste muzica martiana"}
      aria-label={oprita ? "Porneste muzica martiana" : "Opreste muzica martiana"}
    >
      <span aria-hidden="true">{oprita ? "♪×" : "♫"}</span>
      <small>{oprita ? "OFF" : "MARS"}</small>
    </button>
  );
}
