import { Html, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";

const RAZA_LASER = 47;
const RACIRE_LASER = 1.2;
const DURATA_RESPAWN = 4.2;
const RACIRE_REGENERARE_SCUT = 3500;
const RATA_RATARE = 0.08;
const DECALAJ_TUN_FATA = 2.4;
const DURATA_NUMAR_DAMAGE = 0.9;
const DURATA_IMPACT = 0.26;
const NR_SCANTEI_IMPACT = 5;
const VITEZA_BOLT_LASER = 70;
const LUNGIME_BOLT_LASER = 7.2;
const DURATA_FADE_BOLT = 0.12;
const DURATA_FLASH_TUN = 0.12;

export default function GestionarLupta({
  playerRef,
  pozitiiInamici,
  inamici,
  seteazaInamici,
  tintaSelectata,
  seteazaTintaSelectata,
  ataca,
  seteazaAtaca,
  munitie,
  cantitateMunitie = 0,
  onConsumaMunitie,
  damageLasere = 0,
  scutMax = 100,
  seteazaScutJucator,
  declanseazaImpulsScut,
  ultimaLovituraRef,
  onStatus,
  onDistrugeInamic,
  daunePrimiteJucator = [],
  setDaunePrimiteJucator,
}) {
  const racireLaser = useRef(0);
  const acumulatorRegenerare = useRef(0);
  const ultimaActualizareScut = useRef(0);
  const [lasere, seteazaLasere] = useState([]);
  const [numereDamage, seteazaNumereDamage] = useState([]);
  const [impacturi, seteazaImpacturi] = useState([]);

  useFrame((stare, deltaBrut) => {
    const delta = Math.min(deltaBrut, 0.05);
    racireLaser.current = Math.max(0, racireLaser.current - delta);

    if (performance.now() - ultimaLovituraRef.current > RACIRE_REGENERARE_SCUT) {
      const vitezaRegen = Math.max(4.5, scutMax * 0.02);
      acumulatorRegenerare.current += vitezaRegen * delta;
    }

    if (
      acumulatorRegenerare.current > 0 &&
      stare.clock.elapsedTime - ultimaActualizareScut.current > 0.15
    ) {
      ultimaActualizareScut.current = stare.clock.elapsedTime;
      const adaos = acumulatorRegenerare.current;
      acumulatorRegenerare.current = 0;
      seteazaScutJucator((valoare) => Math.min(scutMax, valoare + adaos));
    }

    const areDeRespawnat = inamici.some(
      (inamic) => !inamic.activ && inamic.respawnLa !== null && stare.clock.elapsedTime >= inamic.respawnLa
    );

    if (areDeRespawnat) {
      seteazaInamici((lista) =>
        lista.map((inamic) => {
          if (inamic.activ || inamic.respawnLa === null || stare.clock.elapsedTime < inamic.respawnLa) {
            return inamic;
          }
          return {
            ...inamic,
            activ: true,
            hp: inamic.hpMax ?? 100,
            scut: inamic.scutMax ?? 70,
            respawnLa: null,
            nonce: inamic.nonce + 1,
          };
        })
      );
    }

    seteazaLasere((lista) => {
      if (lista.length === 0) return lista;

      return lista
        .map((laser) => ({ ...laser, viata: laser.viata - delta }))
        .filter((laser) => laser.viata > 0);
    });

    seteazaNumereDamage((lista) => {
      if (lista.length === 0) return lista;

      return lista
        .map((numar) => ({ ...numar, viata: numar.viata - delta }))
        .filter((numar) => numar.viata > 0);
    });

    seteazaImpacturi((lista) => {
      if (lista.length === 0) return lista;

      return lista
        .map((impact) => ({ ...impact, viata: impact.viata - delta }))
        .filter((impact) => impact.viata > 0);
    });

    setDaunePrimiteJucator?.((lista) => {
      if (lista.length === 0) return lista;
      return lista
        .map((n) => ({ ...n, viata: n.viata - delta }))
        .filter((n) => n.viata > 0);
    });

    if (!ataca || !tintaSelectata || !playerRef?.current) return;

    const inamic = inamici.find((item) => item.id === tintaSelectata);
    if (!inamic || !inamic.activ) {
      seteazaAtaca(false);
      seteazaTintaSelectata(null);
      return;
    }

    const pozitieInamic = pozitiiInamici.current[tintaSelectata];
    if (!pozitieInamic) return;

    const distanta = playerRef.current.distanceTo(pozitieInamic);

    if (distanta > RAZA_LASER) {
      onStatus?.("tinta in afara razei");
      return;
    }

    if (racireLaser.current > 0) return;

    if (cantitateMunitie <= 0 || damageLasere <= 0) {
      onStatus?.(
        cantitateMunitie <= 0 && damageLasere <= 0
          ? "fara arme si munitie"
          : damageLasere <= 0
          ? "fara tun laser echipat"
          : "fara munitie"
      );
      seteazaAtaca(false);
      return;
    }

    racireLaser.current = RACIRE_LASER;
    onConsumaMunitie?.();

    const aRatat = Math.random() < RATA_RATARE;

    const centruInamic = pozitieInamic.clone().add(new THREE.Vector3(0, 0.5, 0));
    const directieLaser = centruInamic.clone().sub(playerRef.current).normalize();
    const lateralLaser = new THREE.Vector3(-directieLaser.z, 0, directieLaser.x);
    const punctTunuri = playerRef.current.clone().addScaledVector(directieLaser, DECALAJ_TUN_FATA);

    const punctImpact = aRatat
      ? centruInamic
          .clone()
          .addScaledVector(lateralLaser, (Math.random() - 0.5) * 5.5)
          .add(new THREE.Vector3(0, (Math.random() - 0.5) * 2.2, 0))
      : centruInamic.clone();

    if (!aRatat) {
      const mult = munitie.multiplicator || 1;
      const dauneScut = munitie.shieldDamage * mult;
      const daunaCorp = damageLasere * mult;

      const scutDrenat = Math.min(inamic.scut, dauneScut);
      const scutNou = inamic.scut - scutDrenat;

      let daunaReala;
      if (munitie.drainShield) {
        daunaReala = scutNou <= 0 ? 1.5 : 0;
      } else if (inamic.scut <= 0) {
        daunaReala = daunaCorp;
      } else if (scutNou <= 0) {
        const exces = dauneScut - inamic.scut;
        daunaReala = exces * 0.3;
      } else {
        daunaReala = 0;
      }

      const hpNou = Math.max(0, inamic.hp - daunaReala);
      const aFostDistrus = hpNou <= 0;

      const afisajDauna = munitie.drainShield ? Math.round(scutDrenat) : Math.round(daunaCorp);

      seteazaNumereDamage((lista) => [
        ...lista.slice(-9),
        {
          id: `dmg-${tintaSelectata}-${stare.clock.elapsedTime.toFixed(3)}`,
          pozitie: centruInamic.toArray(),
          valoare: afisajDauna,
          viata: DURATA_NUMAR_DAMAGE,
        },
      ]);

      seteazaImpacturi((lista) => [
        ...lista.slice(-9),
        {
          id: `imp-${tintaSelectata}-${stare.clock.elapsedTime.toFixed(3)}`,
          pozitie: punctImpact.toArray(),
          culoare: munitie.color,
          viata: DURATA_IMPACT,
        },
      ]);

      seteazaInamici((lista) =>
        lista.map((item) => {
          if (item.id !== tintaSelectata) return item;

          if (aFostDistrus) {
            return {
              ...item,
              hp: 0,
              scut: scutNou,
              activ: false,
              respawnLa: stare.clock.elapsedTime + DURATA_RESPAWN,
              impulsLovitura: item.impulsLovitura + 1,
            };
          }

          return { ...item, hp: hpNou, scut: scutNou, impulsLovitura: item.impulsLovitura + 1 };
        })
      );

      if (munitie.drainShield && scutDrenat > 0) {
        seteazaScutJucator((valoare) => Math.min(100, valoare + scutDrenat * 0.55));
        declanseazaImpulsScut();
      }

      if (aFostDistrus) {
        onStatus?.("tinta distrusa");
        onDistrugeInamic?.();
      }
    }

    const timpCalatorie = punctTunuri.distanceTo(punctImpact) / VITEZA_BOLT_LASER;

    seteazaLasere((lista) => [
      ...lista.slice(-7),
      {
        id: `${tintaSelectata}-${stare.clock.elapsedTime.toFixed(3)}`,
        start: punctTunuri.toArray(),
        end: punctImpact.toArray(),
        lateral: [lateralLaser.x, lateralLaser.y, lateralLaser.z],
        culoare: munitie.color,
        timpCalatorie,
        durataTotala: timpCalatorie + DURATA_FADE_BOLT,
        viata: timpCalatorie + DURATA_FADE_BOLT,
        impact: !aRatat,
      },
    ]);

    onStatus?.(aRatat ? "laser ratat" : munitie.drainShield ? "sab activ" : "laser activ");
  });

  return (
    <>
      {lasere.map((laser) => (
        <FasciculLaser key={laser.id} laser={laser} />
      ))}
      {impacturi.map((impact) => (
        <EfectImpact key={impact.id} impact={impact} />
      ))}
      {numereDamage.map((numar) => (
        <NumarDamage key={numar.id} numar={numar} />
      ))}
      {daunePrimiteJucator.map((numar) => (
        <NumarDaunaJucator key={numar.id} numar={numar} playerRef={playerRef} />
      ))}
    </>
  );
}

function NumarDaunaJucator({ numar, playerRef }) {
  const alfa = Math.max(0, numar.viata / 0.9);
  const ridicare = (1 - alfa) * 2.5;
  const pos = playerRef?.current
    ? [playerRef.current.x + (numar.offsetX || 0), playerRef.current.y + 2.2 + ridicare, playerRef.current.z]
    : [0, 5, 0];

  return (
    <Html position={pos} center sprite>
      <div className="numar-damage numar-damage-jucator" style={{ opacity: alfa }}>
        -{numar.valoare}
      </div>
    </Html>
  );
}

function NumarDamage({ numar }) {
  const alfa = Math.max(0, numar.viata / DURATA_NUMAR_DAMAGE);
  const ridicare = (1 - alfa) * 1.6;

  return (
    <Html position={[numar.pozitie[0], numar.pozitie[1] + ridicare, numar.pozitie[2]]} center sprite>
      <div className="numar-damage" style={{ opacity: alfa }}>
        -{numar.valoare}
      </div>
    </Html>
  );
}

function FasciculLaser({ laser }) {
  const varsta = laser.durataTotala - laser.viata;
  const inCalatorie = varsta < laser.timpCalatorie;
  const progresCalatorie = THREE.MathUtils.clamp(varsta / Math.max(0.0001, laser.timpCalatorie), 0, 1);
  const alfa = inCalatorie
    ? 1
    : Math.max(0, 1 - (varsta - laser.timpCalatorie) / DURATA_FADE_BOLT);
  const alfaFlash = Math.max(0, 1 - varsta / DURATA_FLASH_TUN);
  const [lx, ly, lz] = laser.lateral || [0, 0, 0];
  const decalaj = 0.4;

  const capatS = new THREE.Vector3(...laser.start);
  const capatDFinal = new THREE.Vector3(...laser.end);
  const directie = capatDFinal.clone().sub(capatS);
  const distantaTotala = directie.length();
  directie.normalize();

  const cap = capatS.clone().lerp(capatDFinal, progresCalatorie);
  const lungimeCoada = Math.min(LUNGIME_BOLT_LASER, distantaTotala * progresCalatorie);
  const coada = cap.clone().addScaledVector(directie, -lungimeCoada);

  const start1 = [coada.x + lx * decalaj, coada.y + ly * decalaj, coada.z + lz * decalaj];
  const end1 = [cap.x + lx * decalaj, cap.y + ly * decalaj, cap.z + lz * decalaj];
  const start2 = [coada.x - lx * decalaj, coada.y - ly * decalaj, coada.z - lz * decalaj];
  const end2 = [cap.x - lx * decalaj, cap.y - ly * decalaj, cap.z - lz * decalaj];

  return (
    <>
      <Line points={[start1, end1]} color={laser.culoare} transparent opacity={alfa * 0.6} lineWidth={20} />
      <Line points={[start2, end2]} color={laser.culoare} transparent opacity={alfa * 0.6} lineWidth={20} />
      <Line points={[start1, end1]} color="#ffffff" transparent opacity={Math.min(1, alfa * 1.1)} lineWidth={6.5} />
      <Line points={[start2, end2]} color="#ffffff" transparent opacity={Math.min(1, alfa * 1.1)} lineWidth={6.5} />
      <group position={capatS.toArray()}>
        <mesh scale={0.35 + alfaFlash * 0.4}>
          <sphereGeometry args={[0.32, 8, 6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={alfaFlash * 0.85} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh scale={0.55 + alfaFlash * 0.5}>
          <sphereGeometry args={[0.32, 8, 6]} />
          <meshBasicMaterial color={laser.culoare} transparent opacity={alfaFlash * 0.4} depthWrite={false} toneMapped={false} />
        </mesh>
        <pointLight color={laser.culoare} intensity={alfaFlash * 2.6} distance={4} />
      </group>
    </>
  );
}

function EfectImpact({ impact }) {
  const alfa = Math.max(0, impact.viata / DURATA_IMPACT);
  const progres = 1 - alfa;

  const scantei = useMemo(
    () =>
      Array.from({ length: NR_SCANTEI_IMPACT }, () => ({
        unghi: Math.random() * Math.PI * 2,
        raza: 0.55 + Math.random() * 0.5,
        lungime: 0.35 + Math.random() * 0.35,
      })),
    [impact.id]
  );

  const praf = useMemo(
    () =>
      Array.from({ length: 4 }, () => ({
        unghi: Math.random() * Math.PI * 2,
        raza: 0.2 + Math.random() * 0.35,
        marime: 0.18 + Math.random() * 0.16,
      })),
    [impact.id]
  );

  return (
    <group position={impact.pozitie}>
      <mesh scale={0.5 + alfa * 0.55}>
        <sphereGeometry args={[0.32, 8, 6]} />
        <meshBasicMaterial color="#fff6e0" transparent opacity={alfa * 0.85} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh scale={0.65 + progres * 0.85}>
        <sphereGeometry args={[0.32, 8, 6]} />
        <meshBasicMaterial color={impact.culoare} transparent opacity={alfa * 0.3} depthWrite={false} toneMapped={false} />
      </mesh>
      {praf.map((bulgare, index) => {
        const distanta = bulgare.raza * progres;
        return (
          <mesh
            key={`praf-${index}`}
            position={[Math.cos(bulgare.unghi) * distanta, -0.05, Math.sin(bulgare.unghi) * distanta]}
            scale={bulgare.marime * (0.5 + progres)}
          >
            <sphereGeometry args={[0.3, 6, 5]} />
            <meshBasicMaterial color="#c9bd9a" transparent opacity={alfa * 0.22} depthWrite={false} toneMapped={false} />
          </mesh>
        );
      })}
      {scantei.map((scanteie, index) => {
        const distanta = scanteie.raza * progres;
        return (
          <mesh
            key={index}
            position={[Math.cos(scanteie.unghi) * distanta, 0, Math.sin(scanteie.unghi) * distanta]}
            rotation={[0, -scanteie.unghi, 0]}
            scale={[scanteie.lungime * alfa, 1, 1]}
          >
            <boxGeometry args={[1, 0.045, 0.045]} />
            <meshBasicMaterial color="#ffe9bf" transparent opacity={alfa * 0.75} depthWrite={false} toneMapped={false} />
          </mesh>
        );
      })}
      <pointLight color={impact.culoare} intensity={alfa * 3} distance={4} />
    </group>
  );
}
