export type ChemistryMode =
  | "atom"
  | "periodic"
  | "reactivity"
  | "titration"
  | "gas"
  | "organic"
  | "catalyst"
  | "thermo"
  | "electrolysis"
  | "enzyme";

export type ChemistryControl = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
};

export type ChemistryMetric = {
  label: string;
  value: string;
};

export type ChemistryLabDefinition = {
  title: string;
  summary: string;
  mode: ChemistryMode;
  defaults: Record<string, number>;
  controls: ChemistryControl[];
  badges: string[];
  steps: string[];
  metrics: (values: Record<string, number>) => ChemistryMetric[];
  insight: (values: Record<string, number>) => string;
};

export const chemistryLabs: Record<string, ChemistryLabDefinition> = {
  "atom-model": {
    title: "Atom modeli va elektron qatlamlari",
    summary: "Elektron qatlamlari, proton va neytronlar soni atomning xossalariga qanday tasir qilishini kuzating.",
    mode: "atom",
    defaults: { protons: 8, electrons: 8, shells: 2 },
    controls: [
      { key: "protons", label: "Protonlar", min: 1, max: 20, step: 1, unit: "ta" },
      { key: "electrons", label: "Elektronlar", min: 1, max: 20, step: 1, unit: "ta" },
      { key: "shells", label: "Qavatlar", min: 1, max: 4, step: 1, unit: "ta" },
    ],
    badges: ["Z = protonlar soni", "Neytral atom: p = e", "Qavatlar modelini kuzating"],
    steps: ["Proton va elektron sonini tanlang.", "Qavatlar sonini o'zgartiring.", "Atom neytralmi yoki ionmi kuzating."],
    metrics: (v) => [
      { label: "Atom raqami Z", value: `${v.protons.toFixed(0)}` },
      { label: "Zaryad", value: `${(v.protons - v.electrons).toFixed(0)}` },
      { label: "Qavatlar", value: `${v.shells.toFixed(0)}` },
    ],
    insight: (v) =>
      v.protons === v.electrons
        ? "Atom neytral holatda. Proton va elektronlar soni teng."
        : v.protons > v.electrons
        ? "Proton ko'p, demak bu musbat ionga yaqinlashmoqda."
        : "Elektron ko'p, demak bu manfiy ionga yaqinlashmoqda.",
  },
  "periodic-jadval": {
    title: "Davriy jadval va atom radiusi",
    summary: "Guruh va period o'zgarganda atom radiusi, metallik va elektrmanfiylik tendensiyalarini ko'ring.",
    mode: "periodic",
    defaults: { period: 3, group: 2, metallic: 60 },
    controls: [
      { key: "period", label: "Period", min: 1, max: 7, step: 1, unit: "" },
      { key: "group", label: "Guruh", min: 1, max: 18, step: 1, unit: "" },
      { key: "metallic", label: "Metallik", min: 0, max: 100, step: 1, unit: "%" },
    ],
    badges: ["Period bo'yicha radius kamayadi", "Guruh bo'yicha radius ortadi", "Xossa tendensiyasi"],
    steps: ["Periodni suring.", "Guruhni o'zgartiring.", "Yadro va radius nisbatini kuzating."],
    metrics: (v) => [
      { label: "Taxminiy radius", value: `${(220 - v.period * 18 + v.group * 3).toFixed(0)} pm` },
      { label: "Metallik", value: `${v.metallic.toFixed(0)} %` },
      { label: "Elektrmanfiylik", value: `${(0.7 + v.group * 0.12 + v.period * 0.05).toFixed(2)}` },
    ],
    insight: (v) =>
      v.group <= 2
        ? "Chap tomondagi elementlar odatda metallik xossalarga yaqin bo'ladi."
        : v.group >= 16
        ? "O'ng tomondagi elementlarda elektrmanfiylik kuchliroq bo'ladi."
        : "Oraliq guruhlar o'tish xossalarini ko'rsatadi.",
  },
  reaktivlik: {
    title: "Metallar reaktivligi va gaz ajralishi",
    summary: "Metall faol bo'lsa, eritmada tezroq reaksiya beradi va ko'proq pufakchalar hosil qiladi.",
    mode: "reactivity",
    defaults: { metal: 70, acid: 60, temp: 28 },
    controls: [
      { key: "metal", label: "Metall faolligi", min: 10, max: 100, step: 1, unit: "%" },
      { key: "acid", label: "Kislota kuchi", min: 10, max: 100, step: 1, unit: "%" },
      { key: "temp", label: "Harorat", min: 15, max: 80, step: 1, unit: "C" },
    ],
    badges: ["Faollik katta bo'lsa reaksiya tezroq", "Kislota kuchaysa gaz ko'payadi", "Harorat tezlikni oshiradi"],
    steps: ["Metall faolligini tanlang.", "Kislota kuchini oshiring.", "Pufakchalar tezligini taqqoslang."],
    metrics: (v) => [
      { label: "Reaksiya tezligi", value: `${(v.metal * 0.4 + v.acid * 0.35 + v.temp * 0.25).toFixed(0)} %` },
      { label: "Gaz ajralishi", value: `${(v.metal * v.acid / 120).toFixed(1)} birlik` },
      { label: "Xavfsizlik", value: v.temp > 60 ? "Diqqat kerak" : "Oddiy" },
    ],
    insight: (v) =>
      v.metal > 75 && v.acid > 70
        ? "Juda faol kombinatsiya. Gaz ajralishi juda tez bo'ladi."
        : "Sharoit yumshoqroq. Reaksiya ko'zga ko'rinarli, lekin sekinroq.",
  },
  "ph-ojiz": {
    title: "Kislota va ishqor titrlash",
    summary: "Byureta orqali eritma tomchilab qo'shiladi va indikator rangining o'zgarishini kuzatasiz.",
    mode: "titration",
    defaults: { drops: 45, indicator: 65, concentration: 50 },
    controls: [
      { key: "drops", label: "Tomchilar soni", min: 0, max: 100, step: 1, unit: "ta" },
      { key: "indicator", label: "Indikator sezgirligi", min: 10, max: 100, step: 1, unit: "%" },
      { key: "concentration", label: "Eritma konsentratsiyasi", min: 10, max: 100, step: 1, unit: "%" },
    ],
    badges: ["Rang pushti-dan rangsizga o'tadi", "Ekvivalent nuqta", "Tomchilash tezligi muhim"],
    steps: ["Tomchilar sonini oshiring.", "Rang almashinuvi qachon boshlanganini kuzating.", "Ekvivalent nuqtani toping."],
    metrics: (v) => [
      { label: "Taxminiy pH", value: `${(2 + (v.drops / 18) + v.indicator / 100).toFixed(1)}` },
      { label: "Ekvivalentga yaqinlik", value: `${Math.max(0, 100 - Math.abs(v.drops - v.concentration) * 1.8).toFixed(0)} %` },
      { label: "Rang intensivligi", value: `${Math.max(0, 100 - v.drops + v.indicator / 2).toFixed(0)} %` },
    ],
    insight: (v) =>
      Math.abs(v.drops - v.concentration) < 8
        ? "Tomchilar miqdori ekvivalent nuqtaga yaqin. Rang tez almashadi."
        : "Hali eritmalar nisbatini o'zgartirib ekvivalent nuqtaga yaqinlashish mumkin.",
  },
  "gaz-loviy": {
    title: "Gaz ajralishi reaksiyasi",
    summary: "Reaksiyada gaz chiqqanda pufakchalar soni va bosim qanday o'zgarishini ko'ring.",
    mode: "gas",
    defaults: { reactants: 60, temperature: 35, vessel: 65 },
    controls: [
      { key: "reactants", label: "Reagent miqdori", min: 10, max: 100, step: 1, unit: "%" },
      { key: "temperature", label: "Harorat", min: 10, max: 90, step: 1, unit: "C" },
      { key: "vessel", label: "Idish hajmi", min: 20, max: 100, step: 1, unit: "%" },
    ],
    badges: ["CO2 yoki H2 chiqishi", "Pufakchalar soni", "Bosim-hajm bog'lanishi"],
    steps: ["Reagent miqdorini oshiring.", "Haroratni o'zgartiring.", "Bosim ko'rsatkichini kuzating."],
    metrics: (v) => [
      { label: "Bosim", value: `${((v.reactants * v.temperature) / Math.max(v.vessel, 1)).toFixed(1)} kPa` },
      { label: "Pufakchalar", value: `${(v.reactants * 0.8 + v.temperature * 0.3).toFixed(0)} ta/min` },
      { label: "Gaz hajmi", value: `${(v.reactants * 0.25).toFixed(1)} ml` },
    ],
    insight: (v) =>
      v.vessel < 40
        ? "Idish hajmi kichik. Shu sababli bosim tezroq oshadi."
        : "Idish hajmi kattaroq bo'lsa, gaz erkinroq tarqaladi va bosim sekinroq ko'tariladi.",
  },
  "organik-sintet": {
    title: "Organik sintez va molekula yig'ish",
    summary: "Ikki reagent molekulasi yaqinlashib yangi bog hosil qilganda fazoviy tuzilma qanday ko'rinishini kuzating.",
    mode: "organic",
    defaults: { bond: 40, heat: 45, yield: 60 },
    controls: [
      { key: "bond", label: "Bog hosil bo'lishi", min: 0, max: 100, step: 1, unit: "%" },
      { key: "heat", label: "Qizdirish", min: 20, max: 100, step: 1, unit: "%" },
      { key: "yield", label: "Unum", min: 10, max: 100, step: 1, unit: "%" },
    ],
    badges: ["Molekulalar yaqinlashadi", "Yangi bog hosil bo'ladi", "Unum va sharoit"],
    steps: ["Bog hosil bo'lish ko'rsatkichini oshiring.", "Qizdirish qiymatini tanlang.", "Yakuniy tuzilmani kuzating."],
    metrics: (v) => [
      { label: "Bog uzunligi", value: `${(1.8 - v.bond / 100).toFixed(2)} Å` },
      { label: "Reaksiya unumdorligi", value: `${((v.yield + v.heat * 0.2) / 1.2).toFixed(0)} %` },
      { label: "Mahsulot holati", value: v.bond > 65 ? "Hosil bo'ldi" : "Oraliq holat" },
    ],
    insight: (v) =>
      v.bond > 70
        ? "Bog'lanish shakllandi. Reagentlar mahsulot molekulasiga aylanishga yaqin."
        : "Molekulalar hali orientatsiya bosqichida. Harorat va unum ko'rsatkichini oshirish foydali.",
  },
  katalizator: {
    title: "Katalizator ta'siri",
    summary: "Katalizator aktivatsiya energiyasini kamaytirib, reaksiya tezligini qanday oshirishini kuzating.",
    mode: "catalyst",
    defaults: { catalyst: 70, temp: 35, particles: 55 },
    controls: [
      { key: "catalyst", label: "Katalizator samarasi", min: 0, max: 100, step: 1, unit: "%" },
      { key: "temp", label: "Harorat", min: 10, max: 90, step: 1, unit: "C" },
      { key: "particles", label: "Zarralar soni", min: 10, max: 100, step: 1, unit: "%" },
    ],
    badges: ["Ea kamayadi", "Zarralar to'qnashuvi", "Tezlik ortadi"],
    steps: ["Katalizator qiymatini oshiring.", "Haroratni tanlang.", "To'siq balandligi qanday kamayishini kuzating."],
    metrics: (v) => [
      { label: "Aktivatsiya energiyasi", value: `${(85 - v.catalyst * 0.45).toFixed(1)} kJ/mol` },
      { label: "Reaksiya tezligi", value: `${(v.catalyst * 0.5 + v.temp * 0.3 + v.particles * 0.2).toFixed(0)} %` },
      { label: "To'qnashuvlar", value: `${(v.particles * 1.4).toFixed(0)} ta` },
    ],
    insight: (v) =>
      v.catalyst > 60
        ? "Katalizator aktivatsiya to'sig'ini pasaytirdi, shu sabab zarrachalar tezroq mahsulotga o'tadi."
        : "Katalizator kam. To'siq balandligi hali katta bo'lib turibdi.",
  },
  termokimyo: {
    title: "Termokimyo va kalorimetriya",
    summary: "Issiqlik almashinuvi paytida eritma harorati va entalpiya yo'nalishini kuzating.",
    mode: "thermo",
    defaults: { heat: 55, mass: 60, reaction: 45 },
    controls: [
      { key: "heat", label: "Ajralayotgan issiqlik", min: 0, max: 100, step: 1, unit: "%" },
      { key: "mass", label: "Eritma massasi", min: 20, max: 100, step: 1, unit: "%" },
      { key: "reaction", label: "Reaksiya faolligi", min: 10, max: 100, step: 1, unit: "%" },
    ],
    badges: ["Q = m c ΔT", "Ekzotermik va endotermik", "Harorat grafigi"],
    steps: ["Issiqlik qiymatini o'zgartiring.", "Massa bilan harorat farqini solishtiring.", "Ekzotermik holatni kuzating."],
    metrics: (v) => [
      { label: "Harorat o'zgarishi", value: `${((v.heat * v.reaction) / Math.max(v.mass, 1) / 3).toFixed(1)} C` },
      { label: "Entalpiya yo'nalishi", value: v.heat > 50 ? "Ekzotermik" : "Endotermik" },
      { label: "Q", value: `${(v.heat * 1.6).toFixed(1)} kJ` },
    ],
    insight: (v) =>
      v.mass > 70
        ? "Massa katta bo'lgani uchun harorat sekinroq o'zgaradi."
        : "Massa kichik. Shu sabab bir xil issiqlikda harorat tezroq ko'tariladi yoki tushadi.",
  },
  elektroliz: {
    title: "Elektroliz jarayoni",
    summary: "Tok berilganda ionlar katod va anod tomon siljishini, elektrodlar atrofida pufakchalar hosil bo'lishini kuzating.",
    mode: "electrolysis",
    defaults: { voltage: 14, ions: 60, time: 50 },
    controls: [
      { key: "voltage", label: "Kuchlanish", min: 4, max: 24, step: 1, unit: "V" },
      { key: "ions", label: "Ionlar miqdori", min: 10, max: 100, step: 1, unit: "%" },
      { key: "time", label: "Jarayon vaqti", min: 10, max: 100, step: 1, unit: "%" },
    ],
    badges: ["Katod va anod", "Ionlar harakati", "Gaz ajralishi"],
    steps: ["Kuchlanishni oshiring.", "Ionlar sonini tanlang.", "Elektrod atrofidagi pufakchalarni kuzating."],
    metrics: (v) => [
      { label: "Tok kuchi", value: `${(v.voltage * v.ions / 120).toFixed(2)} A` },
      { label: "Ajralgan modda", value: `${(v.time * v.voltage / 60).toFixed(1)} birlik` },
      { label: "Jarayon holati", value: v.voltage > 12 ? "Faol" : "Sokin" },
    ],
    insight: (v) =>
      v.voltage > 12
        ? "Kuchlanish yuqori. Ionlar tezroq harakatlanadi va elektroliz ancha aniq ko'rinadi."
        : "Kuchlanish pastroq. Jarayon sekinroq boradi.",
  },
  biokimyo: {
    title: "Ferment aktivligi va substrat",
    summary: "Ferment va substrat mos kelganda kompleks hosil bo'ladi va mahsulot ajralishi tezlashadi.",
    mode: "enzyme",
    defaults: { enzyme: 70, substrate: 65, temp: 37 },
    controls: [
      { key: "enzyme", label: "Ferment miqdori", min: 10, max: 100, step: 1, unit: "%" },
      { key: "substrate", label: "Substrat miqdori", min: 10, max: 100, step: 1, unit: "%" },
      { key: "temp", label: "Harorat", min: 10, max: 60, step: 1, unit: "C" },
    ],
    badges: ["Ferment-substrat kompleksi", "Optimal harorat", "Mahsulot hosil bo'lishi"],
    steps: ["Ferment miqdorini tanlang.", "Substrat miqdorini oshiring.", "Optimal haroratda jarayonni kuzating."],
    metrics: (v) => [
      { label: "Aktivlik", value: `${Math.max(0, 100 - Math.abs(v.temp - 37) * 3 + v.enzyme * 0.2).toFixed(0)} %` },
      { label: "Mahsulot", value: `${(v.substrate * v.enzyme / 120).toFixed(1)} birlik` },
      { label: "Kompleks", value: v.temp > 45 ? "Buzilmoqda" : "Barqaror" },
    ],
    insight: (v) =>
      Math.abs(v.temp - 37) < 5
        ? "Harorat optimalga yaqin. Ferment faol ishlamoqda."
        : "Harorat optimaldan uzoqlashsa ferment aktivligi pasayadi.",
  },
};
