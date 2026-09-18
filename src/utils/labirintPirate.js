// Labirinturi originale: treceri largi pentru navă, portalurile rămân libere.
const ZIDURI_52 = [
  { x: -370, z: -190, w: 30, h: 620 },
  { x: -120, z: 190, w: 30, h: 620 },
  { x: 130, z: -190, w: 30, h: 620 },
  { x: 380, z: 190, w: 30, h: 620 },
];

const ZIDURI_53 = [
  { x: -200, z: -380, w: 600, h: 30 },
  { x: 200, z: -130, w: 600, h: 30 },
  { x: -200, z: 120, w: 600, h: 30 },
  { x: 200, z: 370, w: 600, h: 30 },
];

export const LABIRINT_PIRAT = {
  sector52: { ziduri: ZIDURI_52, culoare: "#63aab1", ceata: "#46ad9b", schimb: null },
  sector53: { ziduri: ZIDURI_53, culoare: "#9058a0", ceata: "#a95a9d", schimb: [0, 0, 0] },
};

export function punctBlocat(x, z, ziduri, marja = 8) {
  return ziduri.some(({ x: cx, z: cz, w, h }) =>
    Math.abs(x - cx) < w / 2 + marja && Math.abs(z - cz) < h / 2 + marja
  );
}

function drumLiber(a, b, ziduri) {
  return !ziduri.some(({ x, z, w, h }) => {
    let intrare = 0;
    let iesire = 1;
    for (const [start, delta, minim, maxim] of [
      [a[0], b[0] - a[0], x - w / 2 - 8, x + w / 2 + 8],
      [a[1], b[1] - a[1], z - h / 2 - 8, z + h / 2 + 8],
    ]) {
      if (Math.abs(delta) < 1e-9) {
        if (start < minim || start > maxim) return false;
        continue;
      }
      const t1 = (minim - start) / delta;
      const t2 = (maxim - start) / delta;
      intrare = Math.max(intrare, Math.min(t1, t2));
      iesire = Math.min(iesire, Math.max(t1, t2));
      if (intrare > iesire) return false;
    }
    return intrare <= iesire;
  });
}

// A* pe o grilă mică; folosit doar la un clic pe minimap sau în scenă.
export function rutaPrinLabirint(start, tinta, ziduri) {
  if (!ziduri?.length || drumLiber(start, tinta, ziduri)) return [tinta];
  const pas = 25;
  const margine = -550;
  const numar = 45;
  const index = (x, z) => z * numar + x;
  const centru = (i) => margine + i * pas;
  const celula = (v) => Math.max(0, Math.min(numar - 1, Math.round((v - margine) / pas)));
  const liber = (x, z) => x >= 0 && z >= 0 && x < numar && z < numar
    && !punctBlocat(centru(x), centru(z), ziduri);
  const ceaMaiApropiata = (punct) => {
    const cx = celula(punct[0]);
    const cz = celula(punct[1]);
    for (let r = 0; r < numar; r += 1) {
      for (let dz = -r; dz <= r; dz += 1) {
        for (let dx = -r; dx <= r; dx += 1) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) === r && liber(cx + dx, cz + dz)) {
            return [cx + dx, cz + dz];
          }
        }
      }
    }
    return null;
  };
  const inceput = ceaMaiApropiata(start);
  const sfarsit = ceaMaiApropiata(tinta);
  if (!inceput || !sfarsit) return [];
  const destinatie = index(...sfarsit);
  const cost = new Float64Array(numar * numar).fill(Infinity);
  const anterior = new Int32Array(numar * numar).fill(-1);
  const vizitat = new Uint8Array(numar * numar);
  const deschise = [index(...inceput)];
  cost[deschise[0]] = 0;
  const directii = [-1, 0, 1];
  while (deschise.length) {
    let celMaiBun = 0;
    let scor = Infinity;
    for (let i = 0; i < deschise.length; i += 1) {
      const nod = deschise[i];
      const x = nod % numar;
      const z = Math.floor(nod / numar);
      const estimare = Math.hypot(x - sfarsit[0], z - sfarsit[1]);
      if (cost[nod] + estimare < scor) { scor = cost[nod] + estimare; celMaiBun = i; }
    }
    const nod = deschise.splice(celMaiBun, 1)[0];
    if (nod === destinatie) break;
    if (vizitat[nod]) continue;
    vizitat[nod] = 1;
    const x = nod % numar;
    const z = Math.floor(nod / numar);
    for (const dz of directii) for (const dx of directii) {
      if (!dx && !dz) continue;
      const nx = x + dx;
      const nz = z + dz;
      if (!liber(nx, nz) || (dx && dz && (!liber(x + dx, z) || !liber(x, z + dz)))) continue;
      const vecin = index(nx, nz);
      const nou = cost[nod] + Math.hypot(dx, dz);
      if (nou < cost[vecin]) {
        cost[vecin] = nou;
        anterior[vecin] = nod;
        deschise.push(vecin);
      }
    }
  }
  if (!Number.isFinite(cost[destinatie])) return [];
  const puncte = [];
  for (let nod = destinatie; nod >= 0; nod = anterior[nod]) {
    puncte.push([centru(nod % numar), centru(Math.floor(nod / numar))]);
  }
  puncte.reverse();
  // Scurtăm traseul pe segmente vizibile, evitând zigzagul grilei.
  const netezite = [];
  let sursa = start;
  let i = 0;
  while (i < puncte.length) {
    let j = puncte.length - 1;
    while (j > i && !drumLiber(sursa, puncte[j], ziduri)) j -= 1;
    netezite.push(puncte[j]);
    sursa = puncte[j];
    i = j + 1;
  }
  if (drumLiber(sursa, tinta, ziduri)) netezite.push(tinta);
  return netezite;
}

function generator(seed) {
  let stare = seed >>> 0;
  return () => ((stare = (Math.imul(stare, 1664525) + 1013904223) >>> 0) / 4294967296);
}

export function stelutePaladiu(tema) {
  const zona = LABIRINT_PIRAT[tema];
  if (!zona) return [];
  const aleator = generator(tema === "sector52" ? 0x52fa11ad : 0x53fa11ad);
  const numar = tema === "sector52" ? 32 : 48;
  const puncte = [];
  for (let incercari = 0; puncte.length < numar && incercari < 3000; incercari += 1) {
    const x = -480 + aleator() * 960;
    const z = -480 + aleator() * 960;
    if (punctBlocat(x, z, zona.ziduri, 28)) continue;
    if (Math.hypot(x, z) < (zona.schimb ? 60 : 0)) continue;
    if (Math.hypot(x - 505, z - 505) < 85 || Math.hypot(x + 505, z + 505) < 85) continue;
    if (puncte.some((p) => Math.hypot(p.x - x, p.z - z) < 39)) continue;
    puncte.push({ id: `${tema}-${puncte.length}`, x: Math.round(x), z: Math.round(z) });
  }
  return puncte;
}

export const PUNCTE_PALADIU = {
  sector52: stelutePaladiu("sector52"),
  sector53: stelutePaladiu("sector53"),
};
