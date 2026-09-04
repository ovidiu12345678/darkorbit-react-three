function creeazaRng(seed) {
  let stare = seed >>> 0;
  return function () {
    stare |= 0;
    stare = (stare + 0x6d2b79f5) | 0;
    let t = Math.imul(stare ^ (stare >>> 15), 1 | stare);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function zgomotFractal(x, y, seed, octave) {
  const rng = creeazaRng(seed);
  let suma = 0;
  let amplitudine = 1;
  let total = 0;
  let frecventaX = 1;
  let frecventaY = 1;

  for (let i = 0; i < octave; i += 1) {
    const decalajX = rng() * 1000;
    const decalajY = rng() * 1000;
    const unghi = rng() * Math.PI;
    const ca = Math.cos(unghi);
    const sa = Math.sin(unghi);
    const rx = x * ca - y * sa;
    const ry = x * sa + y * ca;

    suma += amplitudine * Math.sin(rx * frecventaX + decalajX) *
      Math.cos(ry * frecventaY * 1.17 + decalajY);

    total += amplitudine;
    amplitudine *= 0.52;
    frecventaX *= 2.13;
    frecventaY *= 1.97;
  }

  return suma / total;
}

export function clamp01(valoare, min, max) {
  return Math.max(min, Math.min(max, valoare));
}

export function densitateGazLaPunct(x, z, marimeHarta) {
  const scaraNor = 3.2 / marimeHarta;
  const n1 = zgomotFractal(x * scaraNor, z * scaraNor, 121, 5);
  const n2 = zgomotFractal(x * scaraNor * 2.1, z * scaraNor * 2.1, 122, 4);
  const densitate = n1 * 0.6 + n2 * 0.4;
  return clamp01((densitate - 0.05) * 1.8, 0, 1);
}

function deseneazaBandaNebuloasa(ctx, latime, inaltime, opts) {
  const imageData = ctx.createImageData(latime, inaltime);
  const data = imageData.data;

  const densitati = new Float32Array(latime * inaltime);
  let minDensitate = Infinity;
  let maxDensitate = -Infinity;

  for (let py = 0; py < inaltime; py += 1) {
    for (let px = 0; px < latime; px += 1) {
      const xBaza = px / latime;
      const yBaza = py / inaltime;
      const x = xBaza + yBaza * opts.inclinare;
      const y = yBaza - xBaza * opts.inclinare * 0.8;

      const n1 = zgomotFractal(x * 3.0, y * 2.4, opts.densitate1, 6);
      const n2 = zgomotFractal(x * 6.0 + n1 * 1.5, y * 5.0 + n1 * 1.5, opts.densitate2, 5);
      const densitate = n1 * 0.6 + n2 * 0.4;

      densitati[py * latime + px] = densitate;
      if (densitate < minDensitate) minDensitate = densitate;
      if (densitate > maxDensitate) maxDensitate = densitate;
    }
  }

  const interval = Math.max(0.0001, maxDensitate - minDensitate);

  for (let py = 0; py < inaltime; py += 1) {
    for (let px = 0; px < latime; px += 1) {
      const idx = (py * latime + px) * 4;
      const xBaza = px / latime;
      const yBaza = py / inaltime;
      const x = xBaza + yBaza * opts.inclinare;
      const y = yBaza - xBaza * opts.inclinare * 0.8;

      const densitateNorm = (densitati[py * latime + px] - minDensitate) / interval;
      const densitateFinala = Math.pow(clamp01((densitateNorm - opts.prag) * 2.4, 0, 1), 1.25);

      const zgomotCuloareBrut = zgomotFractal(x * 2.2 + 5, y * 2.0 + 5, opts.culoare, 4);
      const zgomotCuloare = clamp01((zgomotCuloareBrut + 1) / 2, 0, 1);

      const amestec = clamp01(zgomotCuloare * 1.4, 0, 1);
      const r = opts.culoare1[0] * (1 - amestec) + opts.culoare2[0] * amestec;
      const g = opts.culoare1[1] * (1 - amestec) + opts.culoare2[1] * amestec;
      const b = opts.culoare1[2] * (1 - amestec) + opts.culoare2[2] * amestec;

      data[idx] = clamp01(r * densitateFinala * opts.intensitate, 0, 255);
      data[idx + 1] = clamp01(g * densitateFinala * opts.intensitate, 0, 255);
      data[idx + 2] = clamp01(b * densitateFinala * opts.intensitate, 0, 255);
      data[idx + 3] = clamp01(densitateFinala * 255, 0, 255);
    }
  }

  return imageData;
}

function deseneazaNebuloasaDuala(ctxPrincipal, latimeCanvas, inaltimeCanvas) {
  const scaraReducere = 2;
  const latime = Math.round(latimeCanvas / scaraReducere);
  const inaltime = Math.round(inaltimeCanvas / scaraReducere);

  const canvasNebuloasa = document.createElement("canvas");
  canvasNebuloasa.width = latime;
  canvasNebuloasa.height = inaltime;
  const ctx = canvasNebuloasa.getContext("2d");

  const bandaCalda = deseneazaBandaNebuloasa(ctx, latime, inaltime, {
    inclinare: 0.25,
    densitate1: 21,
    densitate2: 22,
    culoare: 30,
    culoare1: [210, 90, 40],
    culoare2: [160, 30, 80],
    prag: 0.42,
    intensitate: 0.95,
  });

  const bandaRece = deseneazaBandaNebuloasa(ctx, latime, inaltime, {
    inclinare: -0.55,
    densitate1: 51,
    densitate2: 52,
    culoare: 60,
    culoare1: [40, 150, 190],
    culoare2: [70, 90, 210],
    prag: 0.46,
    intensitate: 0.95,
  });

  const combinat = ctx.createImageData(latime, inaltime);
  for (let i = 0; i < combinat.data.length; i += 4) {
    const a1 = bandaCalda.data[i + 3] / 255;
    const a2 = bandaRece.data[i + 3] / 255;

    combinat.data[i] = Math.min(255, bandaCalda.data[i] * a1 + bandaRece.data[i] * a2);
    combinat.data[i + 1] = Math.min(255, bandaCalda.data[i + 1] * a1 + bandaRece.data[i + 1] * a2);
    combinat.data[i + 2] = Math.min(255, bandaCalda.data[i + 2] * a1 + bandaRece.data[i + 2] * a2);
    combinat.data[i + 3] = Math.min(255, bandaCalda.data[i + 3] + bandaRece.data[i + 3]);
  }

  ctx.putImageData(combinat, 0, 0);

  ctxPrincipal.save();
  ctxPrincipal.filter = "blur(1.4px)";
  ctxPrincipal.drawImage(canvasNebuloasa, 0, 0, latimeCanvas, inaltimeCanvas);
  ctxPrincipal.restore();
}

function deseneazaCampStele(ctx, latime, inaltime, numar) {
  const tinte = ["255, 255, 255", "200, 220, 255", "255, 235, 210"];

  for (let i = 0; i < numar; i += 1) {
    const x = Math.random() * latime;
    const y = Math.random() * inaltime;
    const stralucire = Math.random();
    const raza = 0.4 + stralucire * 1.1;
    const alfa = 0.45 + stralucire * 0.5;
    const tinta = tinte[Math.floor(Math.random() * tinte.length)];

    ctx.fillStyle = `rgba(${tinta}, ${alfa})`;
    ctx.beginPath();
    ctx.arc(x, y, raza, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function creeazaCanvasFundalDepArte() {
  const latime = 1536;
  const inaltime = 956;
  const canvas = document.createElement("canvas");
  canvas.width = latime;
  canvas.height = inaltime;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#03050a";
  ctx.fillRect(0, 0, latime, inaltime);

  deseneazaNebuloasaDuala(ctx, latime, inaltime);
  deseneazaCampStele(ctx, latime, inaltime, 1100);

  return canvas;
}
