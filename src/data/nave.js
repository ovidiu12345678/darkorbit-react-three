export const NAVE = [
  {
    id: "orion-01",
    nume: "ORION-01",
    descriere: "Nava de lupta standard",
    cost: 0,
    moneda: null,
    scutMax: 0,
    culoare: "#7dffef",
    imagine: `${import.meta.env.BASE_URL}assets/GoliathDarkOrbit.png`,
  },
  {
    id: "venator-x",
    nume: "VENATOR-X",
    descriere: "Nava de vanatoare, fara scut de baza - necesita generator de scut echipat",
    cost: 388,
    moneda: "uridium",
    scutMax: 0,
    culoare: "#ff8a3c",
  },
];

export const NAVE_BY_ID = Object.fromEntries(NAVE.map((nava) => [nava.id, nava]));
