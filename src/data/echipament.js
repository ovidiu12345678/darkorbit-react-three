export const TUNURI_LASER = [
  { id: "lf-z1", nume: "LF-Z1", material: "aluminiu", cost: 25000, moneda: "credite", damage: 60, culoare: "#9fb4c4", imagine: `${import.meta.env.BASE_URL}assets/tun LF Z1 (3).png` },
  { id: "lf2-eth", nume: "LF2-ETH", material: "cupru", cost: 65000, moneda: "credite", damage: 125, culoare: "#d68a4c", imagine: `${import.meta.env.BASE_URL}assets/tun LF2 ETH.png` },
  { id: "lf3-pltm", nume: "LF3-PLTM", material: "argint", cost: 15000, moneda: "uridium", damage: 175, culoare: "#e9edf2", imagine: `${import.meta.env.BASE_URL}assets/tun LF3 PLMT.png` },
];

export const TUNURI_BY_ID = Object.fromEntries(TUNURI_LASER.map((tun) => [tun.id, tun]));

export const GENERATOARE = [
  { id: "aegis-core", nume: "AEGIS CORE", cost: 150000, moneda: "credite", capacitate: 10000, absorbtie: 15, culoare: "#5be9ff", forma: "cilindru", imagine: `${import.meta.env.BASE_URL}assets/AEGIS CORE (1).png` },
  { id: "bulwark", nume: "BULWARK", cost: 300000, moneda: "credite", capacitate: 25000, absorbtie: 20, culoare: "#ff9d4d", forma: "octagon", imagine: `${import.meta.env.BASE_URL}assets/BULWARK.png` },
  { id: "prism-shield", nume: "PRISM SHIELD", cost: 750000, moneda: "credite", capacitate: 30000, absorbtie: 20, culoare: "#8a7dff", forma: "inel", imagine: `${import.meta.env.BASE_URL}assets/PRISM SHIELD.png` },
  { id: "nova-guard", nume: "NOVA GUARD", cost: 950000, moneda: "credite", capacitate: 35000, absorbtie: 26, culoare: "#6bffb0", forma: "sfera", imagine: `${import.meta.env.BASE_URL}assets/NOVA GUARD.png` },
  { id: "bastion-node", nume: "BASTION NODE", cost: 6000, moneda: "uridium", capacitate: 65000, absorbtie: 36, culoare: "#ff5ad1", forma: "cristal", imagine: `${import.meta.env.BASE_URL}assets/BASTION NODE.png` },
  { id: "helix-barrier", nume: "HELIX BARRIER", cost: 17000, moneda: "uridium", capacitate: 123000, absorbtie: 59, culoare: "#ffd35a", forma: "disc", imagine: `${import.meta.env.BASE_URL}assets/HELIX BARRIER.png` },
];

export const GENERATOARE_BY_ID = Object.fromEntries(GENERATOARE.map((generator) => [generator.id, generator]));

export const GENERATOARE_VITEZA = [
  { id: "mg-vx434", nume: "MG-VX434", cost: 450000, moneda: "credite", putere: 15, imagine: `${import.meta.env.BASE_URL}assets/MG-VX434.png` },
  { id: "mg-vpl1066798x", nume: "MG-VPL1066798x", cost: 12000, moneda: "uridium", putere: 35, imagine: `${import.meta.env.BASE_URL}assets/MG-VPL1066798x.png` },
  { id: "mg-vzq19600", nume: "MG-VZQ19600", cost: 11600000, moneda: "credite", putere: 20, imagine: `${import.meta.env.BASE_URL}assets/MG-VZQ19600.png` },
];

export const GENERATOARE_VITEZA_BY_ID = Object.fromEntries(GENERATOARE_VITEZA.map((gen) => [gen.id, gen]));

export const NR_SLOTURI_LASERE = 25;
export const NR_SLOTURI_GENERATOARE = 19;
export const NR_SLOTURI_ABILITATI = 6;
export const NR_SLOTURI_SPECIAL = 4;
export const NR_SLOTURI_VITEZA = 19;
export const NR_SLOTURI_LANSATOR = 1;
