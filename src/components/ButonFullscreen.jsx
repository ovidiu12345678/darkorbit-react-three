import { useCallback, useEffect, useRef, useState } from "react";

const POZITIE_INITIALA = { top: 16, right: 340 };
const PRAG_CLIC = 5;

export default function ButonFullscreen() {
  const [pozitie, setPozitie] = useState(POZITIE_INITIALA);
  const [ecranComplet, setEcranComplet] = useState(Boolean(document.fullscreenElement));
  const tragereRef = useRef(null);

  useEffect(() => {
    const laSchimbare = () => setEcranComplet(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", laSchimbare);
    return () => document.removeEventListener("fullscreenchange", laSchimbare);
  }, []);

  const comutaEcranComplet = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  }, []);

  const laApasare = useCallback(
    (eveniment) => {
      eveniment.preventDefault();

      const startX = eveniment.clientX;
      const startY = eveniment.clientY;
      const startPozitie = { ...pozitie };
      let sAMiscat = false;

      tragereRef.current = { startX, startY, startPozitie };

      const laMiscare = (ev) => {
        const stare = tragereRef.current;
        if (!stare) return;

        const dx = ev.clientX - stare.startX;
        const dy = ev.clientY - stare.startY;

        if (Math.abs(dx) > PRAG_CLIC || Math.abs(dy) > PRAG_CLIC) {
          sAMiscat = true;
        }

        setPozitie({
          top: Math.max(4, stare.startPozitie.top + dy),
          right: Math.max(4, stare.startPozitie.right - dx),
        });
      };

      const laRidicare = () => {
        tragereRef.current = null;
        window.removeEventListener("mousemove", laMiscare);
        window.removeEventListener("mouseup", laRidicare);

        if (!sAMiscat) {
          comutaEcranComplet();
        }
      };

      window.addEventListener("mousemove", laMiscare);
      window.addEventListener("mouseup", laRidicare);
    },
    [pozitie, comutaEcranComplet]
  );

  return (
    <button
      type="button"
      className="buton-fullscreen"
      style={{ top: pozitie.top, right: pozitie.right }}
      onMouseDown={laApasare}
      title="Ecran complet (trage pentru a muta)"
    >
      {ecranComplet ? "⤡" : "⛶"}
    </button>
  );
}
