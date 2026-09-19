// Pereți de asteroizi fragmentați; culoarele, baza centrală și portalurile rămân libere.
const ZIDURI_52 = [
  // Contur exterior fragmentat, cu intrări largi ca în zona piraților.
  { x: -401, z: -300, w: 44, h: 290 }, { x: -401, z: 128, w: 46, h: 360 },
  { x: -278, z: -420, w: 205, h: 44 }, { x: 62, z: -420, w: 242, h: 44 },
  { x: 369, z: -349, w: 197, h: 44 }, { x: 434, z: -152, w: 44, h: 181 },
  { x: 434, z: 201, w: 44, h: 219 }, { x: 342, z: 420, w: 230, h: 44 },
  { x: -47, z: 420, w: 272, h: 44 }, { x: -335, z: 377, w: 142, h: 44 },
  // Potcoava centrală: deschisă spre dreapta, cu baza piraților în interior.
  { x: -98, z: -145, w: 90, h: 38 }, { x: -15, z: -162, w: 92, h: 38 },
  { x: 70, z: -145, w: 80, h: 38 }, { x: -143, z: -103, w: 40, h: 78 },
  { x: -162, z: -31, w: 40, h: 76 }, { x: -162, z: 50, w: 40, h: 76 },
  { x: -140, z: 119, w: 40, h: 67 }, { x: -91, z: 151, w: 78, h: 38 },
  { x: -12, z: 166, w: 88, h: 38 }, { x: 72, z: 147, w: 78, h: 38 },
  // Două creste secundare care creează traseul de labirint.
  { x: -281, z: -146, w: 42, h: 196 }, { x: -271, z: 218, w: 42, h: 166 },
  { x: 276, z: -216, w: 42, h: 198 }, { x: 276, z: 143, w: 42, h: 170 },
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
      { x: -335, z: -81, w: 310, h: 350 }, { x: -45, z: -385, w: 405, h: 215 },
      { x: 330, z: -202, w: 326, h: 351 }, { x: 345, z: 298, w: 344, h: 276 },
      { x: -260, z: 340, w: 370, h: 253 }, { x: -15, z: 16, w: 385, h: 340 },
    ],
  },
  sector53: {
    ziduri: ZIDURI_53, culoare: "#827c98", ceata: "#9b9aa9", schimb: null,
    nori: [
      { x: -329, z: -333, w: 398, h: 265 }, { x: 233, z: -269, w: 390, h: 318 },
      { x: -237, z: 86, w: 407, h: 318 }, { x: 324, z: 219, w: 364, h: 318 },
      { x: -104, z: 350, w: 420, h: 245 }, { x: 70, z: -20, w: 335, h: 284 },
    ],
  },
};

export function densitateCeataPirata(tema, x, z) {
  const zona = LABIRINT_PIRAT[tema];
  if (!zona?.nori?.length) return 0;
  let densitate = 0;
  for (const nor of zona.nori) {
    const distanta = Math.hypot((x - nor.x) / (nor.w * 0.5), (z - nor.z) / (nor.h * 0.5));
    if (distanta < 1) densitate = Math.max(densitate, Math.min(1, (1 - distanta) * 2.35));
  }
  return densitate;
}

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
