import { useEffect, useRef } from "react";

export default function folosesteTastatura() {
  const tasteApasate = useRef({});

  useEffect(() => {
    const candApasaTasta = (eveniment) => {
      tasteApasate.current[eveniment.code] = true;
    };

    const candRidicaTasta = (eveniment) => {
      tasteApasate.current[eveniment.code] = false;
    };

    window.addEventListener("keydown", candApasaTasta);
    window.addEventListener("keyup", candRidicaTasta);

    return () => {
      window.removeEventListener("keydown", candApasaTasta);
      window.removeEventListener("keyup", candRidicaTasta);
    };
  }, []);

  return tasteApasate;
}
