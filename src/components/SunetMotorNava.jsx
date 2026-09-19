import { useEffect, useRef } from "react";

export default function SunetMotorNava({ playerRef, activ = true, volum = 65 }) {
  const setariRef = useRef({ activ, volum });
  setariRef.current = { activ, volum };

  useEffect(() => {
    let context = null;
    let master = null;
    let filtru = null;
    let oscilatorGrav = null;
    let oscilatorArmonic = null;
    let sursaAer = null;
    let cadru = 0;
    let ultimaPozitie = null;
    let ultimulTimp = performance.now();

    const porneste = async () => {
      if (context) {
        if (context.state === "suspended") await context.resume();
        return;
      }
      const AudioContextClasa = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClasa) return;
      context = new AudioContextClasa();

      master = context.createGain();
      master.gain.value = 0.0001;
      const compresor = context.createDynamicsCompressor();
      compresor.threshold.value = -24;
      compresor.ratio.value = 5;
      compresor.attack.value = 0.012;
      compresor.release.value = 0.24;
      filtru = context.createBiquadFilter();
      filtru.type = "lowpass";
      filtru.frequency.value = 310;
      filtru.Q.value = 1.35;

      oscilatorGrav = context.createOscillator();
      oscilatorGrav.type = "sawtooth";
      oscilatorGrav.frequency.value = 47;
      const volumGrav = context.createGain();
      volumGrav.gain.value = 0.62;

      oscilatorArmonic = context.createOscillator();
      oscilatorArmonic.type = "triangle";
      oscilatorArmonic.detune.value = 7;
      oscilatorArmonic.frequency.value = 94;
      const volumArmonic = context.createGain();
      volumArmonic.gain.value = 0.24;

      const durataZgomot = context.sampleRate * 2;
      const buffer = context.createBuffer(1, durataZgomot, context.sampleRate);
      const date = buffer.getChannelData(0);
      for (let i = 0; i < date.length; i += 1) date[i] = (Math.random() * 2 - 1) * 0.34;
      sursaAer = context.createBufferSource();
      sursaAer.buffer = buffer;
      sursaAer.loop = true;
      const filtruAer = context.createBiquadFilter();
      filtruAer.type = "bandpass";
      filtruAer.frequency.value = 190;
      filtruAer.Q.value = 0.72;
      const volumAer = context.createGain();
      volumAer.gain.value = 0.16;

      oscilatorGrav.connect(volumGrav).connect(filtru);
      oscilatorArmonic.connect(volumArmonic).connect(filtru);
      sursaAer.connect(filtruAer).connect(volumAer).connect(filtru);
      filtru.connect(compresor).connect(master).connect(context.destination);
      oscilatorGrav.start();
      oscilatorArmonic.start();
      sursaAer.start();
    };

    const actualizeaza = (acum) => {
      if (context && master && playerRef?.current) {
        const pozitie = playerRef.current;
        const dt = Math.max(0.016, Math.min(0.12, (acum - ultimulTimp) / 1000));
        let miscare = 0;
        if (ultimaPozitie) {
          const distanta = Math.hypot(pozitie.x - ultimaPozitie.x, pozitie.z - ultimaPozitie.z);
          if (distanta < 90) miscare = Math.min(1, distanta / dt / 8);
        }
        ultimaPozitie = { x: pozitie.x, z: pozitie.z };
        ultimulTimp = acum;

        const nivel = setariRef.current.activ ? setariRef.current.volum / 100 : 0;
        const volumTinta = nivel * (0.018 + miscare * 0.095);
        const timp = context.currentTime;
        master.gain.setTargetAtTime(Math.max(0.0001, volumTinta), timp, miscare > 0.05 ? 0.08 : 0.32);
        oscilatorGrav.frequency.setTargetAtTime(47 + miscare * 31, timp, 0.11);
        oscilatorArmonic.frequency.setTargetAtTime(94 + miscare * 69, timp, 0.1);
        filtru.frequency.setTargetAtTime(260 + miscare * 560, timp, 0.13);
      }
      cadru = requestAnimationFrame(actualizeaza);
    };

    const laInteractiune = () => { porneste(); };
    window.addEventListener("pointerdown", laInteractiune);
    window.addEventListener("keydown", laInteractiune);
    cadru = requestAnimationFrame(actualizeaza);

    return () => {
      window.removeEventListener("pointerdown", laInteractiune);
      window.removeEventListener("keydown", laInteractiune);
      cancelAnimationFrame(cadru);
      try { oscilatorGrav?.stop(); oscilatorArmonic?.stop(); sursaAer?.stop(); } catch { /* deja oprit */ }
      context?.close();
    };
  }, [playerRef]);

  return null;
}
