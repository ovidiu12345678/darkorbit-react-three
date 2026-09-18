// Sprite-urile sunt decupate dintr-un atlas 4×2 și plasate o singură dată
// în lume; mini-harta folosește aceleași coordonate.
const CENTRE = [
  [0.125, 0.25], [0.375, 0.25], [0.625, 0.25], [0.875, 0.25],
  [0.125, 0.75], [0.375, 0.75], [0.625, 0.75], [0.875, 0.75],
];

function corpuri(nume) {
  return nume.map((eticheta, index) => ({
    nume: eticheta,
    centru: CENTRE[index],
    decupaj: [0.245, 0.47],
    marime: index === 3 || index === 7 ? [45, 34] : [38, 36],
    mini: index === 3 || index === 7 ? [19, 24] : [18, 24],
  }));
}

export const SECTOARE_NOI = {
  sector45: {
    nume: "Sector 4-5", anterior: "frontiera18", urmator: "sector51",
    fundal: "assets/fundal-sector-45.png", atlas: "assets/corpuri-sector-45-atlas.png",
    portal: "assets/portal-sector-45.png", culoare: "#73e2ed", accent: "#d45c68", rece: "#5369aa",
    seed: 0x45a03f1, paleta: ["#79d9de", "#ad647a", "#879bc5"],
    corpuri: corpuri(["Gigantul de Gheață Fisurată", "Pitica Neagră Rubin", "Exoplaneta Cuprului", "Nodul de Gaz Cian", "Luna de Ardezie", "Galaxia Violetă", "Câmpul de Asteroizi", "Nebuloasa de Ambră"]),
  },
  sector51: {
    nume: "Sector 5-1", anterior: "sector45", urmator: "sector52",
    fundal: "assets/fundal-sector-51.png", atlas: "assets/corpuri-sector-51-atlas.png",
    portal: "assets/portal-sector-51.png", culoare: "#8de2a6", accent: "#c78b57", rece: "#377d73",
    seed: 0x51b04e2, paleta: ["#a4d7ae", "#be825f", "#548b86"],
    corpuri: corpuri(["Planetoidul de Bronz", "Norul Acid de Smarald", "Luna Carbonizată", "Pitica Turcoaz", "Asteroidul Ruginiu", "Filamentul de Gaz", "Exoplaneta cu Inel Verde", "Fragmentul Meteoric"]),
  },
  sector52: {
    nume: "Sector 5-2", anterior: "sector51", urmator: "sector53",
    fundal: "assets/fundal-sector-52.png", atlas: "assets/corpuri-sector-52-atlas.png",
    portal: "assets/portal-sector-52.png", culoare: "#e9c46d", accent: "#8bd8db", rece: "#747ca9",
    seed: 0x52c05d3, paleta: ["#e4bd72", "#82c9cb", "#8b79b6"],
    corpuri: corpuri(["Exoplaneta cu Vine Aurii", "Nebuloasa de Paladiu", "Pitica de Sulf", "Semiluna Obsidian", "Triada de Asteroizi", "Gigantul de Gaz Cupru", "Galaxia Verde", "Norul de Plasmă Violet"]),
  },
  sector53: {
    nume: "Sector 5-3", anterior: "sector52", urmator: null,
    fundal: "assets/fundal-sector-53.png", atlas: "assets/corpuri-sector-53-atlas.png",
    portal: "assets/portal-sector-53.png", culoare: "#bd83e8", accent: "#f16b71", rece: "#547978",
    seed: 0x53d06e4, paleta: ["#b58cda", "#d77880", "#73aaa0"],
    corpuri: corpuri(["Planeta cu Inel de Ametist", "Vortexul Stacojiu", "Steaua Albă Pitică", "Exoluna de Bazalt", "Cometa Violetă", "Norul Acid Verde", "Asteroidul Ocru", "Galaxia Spirală Întunecată"]),
  },
};
