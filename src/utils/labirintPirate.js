// Pereți de asteroizi fragmentați; culoarele, baza centrală și portalurile rămân libere.
const ZIDURI_52 = [
  { x: -402, z: -316, w: 42, h: 286 },
  { x: -402, z: 111, w: 48, h: 452 },
  { x: -256, z: -407, w: 238, h: 43 },
  { x: -213, z: -142, w: 42, h: 310 },
  { x: -213, z: 345, w: 46, h: 252 },
  { x: -61, z: 392, w: 214, h: 42 },
  { x: -35, z: -338, w: 220, h: 45 },
  { x: 177, z: -315, w: 47, h: 354 },
  { x: 177, z: 250, w: 43, h: 300 },
  { x: 338, z: -418, w: 238, h: 41 },
  { x: 398, z: -110, w: 45, h: 342 },
  { x: 398, z: 369, w: 43, h: 181 },
  { x: 312, z: 145, w: 191, h: 42 },
];

const ZIDURI_53 = [
  { x: -327, z: -405, w: 301, h: 44 },
  { x: 161, z: -405, w: 358, h: 40 },
  { x: -439, z: -247, w: 42, h: 278 },
  { x: -116, z: -254, w: 411, h: 43 },
  { x: 336, z: -259, w: 42, h: 246 },
  { x: 404, z: -106, w: 168, h: 45 },
  { x: -343, z: -37, w: 287, h: 47 },
  { x: -127, z: 54, w: 42, h: 218 },
  { x: 176, z: 60, w: 389, h: 44 },
  { x: 418, z: 235, w: 44, h: 252 },
  { x: -347, z: 224, w: 44, h: 252 },
  { x: -137, z: 281, w: 405, h: 46 },
  { x: 227, z: 398, w: 349, h: 41 },
];

export const LABIRINT_PIRAT = {
  sector52: {
    ziduri: ZIDURI_52, culoare: "#6e9f9b", ceata: "#83aaa9", schimb: [0, 0, 0],
    nori: [
      { x: -320, z: -82, w: 258, h: 280 }, { x: -36, z: -395, w: 330, h: 170 },
      { x: 334, z: -200, w: 253, h: 292 }, { x: 355, z: 305, w: 280, h: 204 },
      { x: -267, z: 351, w: 290, h: 187 },
    ],
  },
  sector53: {
    ziduri: ZIDURI_53, culoare: "#827c98", ceata: "#9b9aa9", schimb: null,
    nori: [
      { x: -329, z: -333, w: 331, h: 204 }, { x: 233, z: -269, w: 325, h: 251 },
      { x: -237, z: 86, w: 337, h: 251 }, { x: 324, z: 219, w: 294, h: 253 },
      { x: -104, z: 350, w: 350, h: 189 },
    ],
  },
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
