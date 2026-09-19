import { useCallback, useEffect, useState } from "react";

export default function ButonFullscreen() {
  const [ecranComplet, setEcranComplet] = useState(Boolean(document.fullscreenElement));

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

  return (
    <button
      type="button"
      className="buton-fullscreen"
      onClick={comutaEcranComplet}
      title="Ecran complet"
    >
      {ecranComplet ? "⤡" : "⛶"}
    </button>
  );
}
