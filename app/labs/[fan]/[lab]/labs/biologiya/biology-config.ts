export type BiologyMode =
  | "photosynthesis"
  | "cell"
  | "dna"
  | "microbiome"
  | "ecosystem"
  | "neuron"
  | "circulation"
  | "genetics"
  | "food"
  | "microbe";

export type BiologyControl = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
};

export type BiologyMetric = {
  label: string;
  value: string;
};

export type BiologyLabDefinition = {
  title: string;
  summary: string;
  mode: BiologyMode;
  defaults: Record<string, number>;
  controls: BiologyControl[];
  badges: string[];
  steps: string[];
  metrics: (values: Record<string, number>) => BiologyMetric[];
  insight: (values: Record<string, number>) => string;
};

export const biologyLabs: Record<string, BiologyLabDefinition> = {
  fotosintez: {
    title: "Fotosintez jarayoni",
    summary: "Yoruglik, suv va karbonat angidrid miqdori oshsa, xloroplast ichida glyukoza hosil bolishi kuchayadi.",
    mode: "photosynthesis",
    defaults: { light: 70, co2: 60, water: 65 },
    controls: [
      { key: "light", label: "Yoruglik", min: 0, max: 100, step: 1, unit: "%" },
      { key: "co2", label: "CO2", min: 0, max: 100, step: 1, unit: "%" },
      { key: "water", label: "Suv", min: 0, max: 100, step: 1, unit: "%" },
    ],
    badges: ["Xloroplast", "Nur energiyasi", "O2 ajralishi"],
    steps: ["Yoruglikni oshiring.", "CO2 va suvni moslang.", "Kislorod pufakchalari sonini kuzating."],
    metrics: (v) => [
      { label: "Fotosintez tezligi", value: `${((v.light + v.co2 + v.water) / 3).toFixed(0)} %` },
      { label: "O2 ajralishi", value: `${((v.light * 0.4 + v.co2 * 0.3 + v.water * 0.3) / 10).toFixed(1)} birlik` },
      { label: "Glyukoza", value: `${((v.light + v.co2) / 18).toFixed(1)} birlik` },
    ],
    insight: (v) =>
      v.light < 20
        ? "Yoruglik kam bo'lsa fotosintez sustlashadi."
        : "Yoruglik, CO2 va suv uyg'un bo'lsa fotosintez ancha faol bo'ladi.",
  },
  "hujayra-daraja": {
    title: "Hujayra tuzilishi",
    summary: "Hujayra ichidagi yadro, mitoxondriya va ribosomalar soni oshganda ichki faollik va energiya almashinuvi o'zgaradi.",
    mode: "cell",
    defaults: { nucleus: 1, mitochondria: 6, ribosomes: 20 },
    controls: [
      { key: "nucleus", label: "Yadro", min: 1, max: 3, step: 1, unit: "ta" },
      { key: "mitochondria", label: "Mitoxondriya", min: 2, max: 12, step: 1, unit: "ta" },
      { key: "ribosomes", label: "Ribosoma", min: 10, max: 60, step: 1, unit: "ta" },
    ],
    badges: ["Yadro", "Mitoxondriya", "Ribosoma"],
    steps: ["Organoidlar sonini o'zgartiring.", "Hujayra ichidagi joylashuvni kuzating.", "Qaysi organoid qaysi vazifani bajarishini taqqoslang."],
    metrics: (v) => [
      { label: "ATP salohiyati", value: `${(v.mitochondria * 8).toFixed(0)} %` },
      { label: "Oqsil sintezi", value: `${(v.ribosomes * 1.4).toFixed(0)} birlik` },
      { label: "Boshqaruv markazi", value: `${v.nucleus.toFixed(0)} ta yadro` },
    ],
    insight: (v) =>
      v.mitochondria > 8
        ? "Mitoxondriya ko'p bo'lsa hujayra energiyasi ko'proq ishlab chiqariladi."
        : "Ribosomalar ko'p bo'lsa oqsil sintezi kuchayadi.",
  },
  "dnk-replikatsiya": {
    title: "DNK replikatsiyasi",
    summary: "DNK zanjiri ochilib, nukleotidlar yangi nusxaga birikadi va replikatsiya bosqichlari ketma-ket yuz beradi.",
    mode: "dna",
    defaults: { helicase: 65, polymerase: 70, nucleotides: 75 },
    controls: [
      { key: "helicase", label: "Helikaza", min: 0, max: 100, step: 1, unit: "%" },
      { key: "polymerase", label: "Polimeraza", min: 0, max: 100, step: 1, unit: "%" },
      { key: "nucleotides", label: "Nukleotidlar", min: 20, max: 100, step: 1, unit: "%" },
    ],
    badges: ["Zanjir ochilishi", "Yangi ip", "Komplementarlik"],
    steps: ["Helikaza tezligini oshiring.", "Polimeraza faoliyatini kuzating.", "Ikki yangi DNK nusxasi hosil bo'lishini ko'ring."],
    metrics: (v) => [
      { label: "Replikatsiya tezligi", value: `${((v.helicase + v.polymerase + v.nucleotides) / 3).toFixed(0)} %` },
      { label: "Nusxa aniqligi", value: `${Math.min(99, 60 + v.polymerase * 0.35).toFixed(0)} %` },
      { label: "Ochilgan qism", value: `${(v.helicase * 0.9).toFixed(0)} %` },
    ],
    insight: (v) =>
      v.nucleotides < 40
        ? "Nukleotidlar kamaysa replikatsiya sekinlashadi."
        : "Polimeraza va nukleotidlar yetarli bo'lsa yangi DNK tezroq yig'iladi.",
  },
  probiotik: {
    title: "Mikrobiom va probiotiklar",
    summary: "Foydali bakteriyalar ko'payganda ichki muhit muvozanati yaxshilanadi, zararli bakteriyalar esa kamayadi.",
    mode: "microbiome",
    defaults: { probiotic: 70, harmful: 45, fiber: 65 },
    controls: [
      { key: "probiotic", label: "Foydali bakteriya", min: 0, max: 100, step: 1, unit: "%" },
      { key: "harmful", label: "Zararli bakteriya", min: 0, max: 100, step: 1, unit: "%" },
      { key: "fiber", label: "Tolali oziq", min: 0, max: 100, step: 1, unit: "%" },
    ],
    badges: ["Mikrobiom", "Probiotik", "Muvozanat"],
    steps: ["Probiotik miqdorini oshiring.", "Tolali oziqni o'zgartiring.", "Foydali va zararli populyatsiya nisbatini kuzating."],
    metrics: (v) => [
      { label: "Muvozanat", value: `${Math.max(0, v.probiotic + v.fiber * 0.4 - v.harmful * 0.6).toFixed(0)} %` },
      { label: "Foydali koloniyalar", value: `${(v.probiotic * 1.3).toFixed(0)} birlik` },
      { label: "Immun qo'llab-quvvatlash", value: `${Math.min(100, v.probiotic * 0.6 + v.fiber * 0.4).toFixed(0)} %` },
    ],
    insight: (v) =>
      v.probiotic > v.harmful
        ? "Foydali bakteriyalar ustun. Ichki muhit barqarorroq."
        : "Zararli bakteriyalar ko'paygan. Muvozanat uchun probiotik va tolali oziqni oshirish kerak.",
  },
  "ekologiya-sistem": {
    title: "Ekosistema dinamikasi",
    summary: "O'simliklar, o'txo'rlar va yirtqichlar o'rtasidagi muvozanat ekosistemaning barqarorligini belgilaydi.",
    mode: "ecosystem",
    defaults: { plants: 75, herbivores: 55, predators: 35 },
    controls: [
      { key: "plants", label: "O'simliklar", min: 10, max: 100, step: 1, unit: "%" },
      { key: "herbivores", label: "O'txo'rlar", min: 10, max: 100, step: 1, unit: "%" },
      { key: "predators", label: "Yirtqichlar", min: 0, max: 100, step: 1, unit: "%" },
    ],
    badges: ["Populyatsiya", "Oziq zanjiri", "Muvozanat"],
    steps: ["O'simliklar sonini tanlang.", "O'txo'rlar sonini o'zgartiring.", "Yirtqichlar ta'sirini kuzating."],
    metrics: (v) => [
      { label: "Barqarorlik", value: `${Math.max(0, 100 - Math.abs(v.plants - v.herbivores) - Math.abs(v.predators - 30)).toFixed(0)} %` },
      { label: "Biomassa", value: `${(v.plants * 0.9 + v.herbivores * 0.5 + v.predators * 0.2).toFixed(0)} birlik` },
      { label: "Oziq bosqichi", value: `${(1 + v.predators / 40).toFixed(1)} daraja` },
    ],
    insight: (v) =>
      v.predators > 70
        ? "Yirtqichlar juda ko'p bo'lsa o'txo'rlar kamayib ketadi."
        : "O'simliklar, o'txo'rlar va yirtqichlar muvozanati ekosistema barqarorligini oshiradi.",
  },
  "asab-sistema": {
    title: "Nerv tizimi va impulslar",
    summary: "Neyron bo'ylab impuls o'tishi, sinapslarda signal uzatilishi va stimulyatsiya kuchi o'zaro bog'langan.",
    mode: "neuron",
    defaults: { stimulus: 70, synapse: 60, speed: 55 },
    controls: [
      { key: "stimulus", label: "Stimulyatsiya", min: 0, max: 100, step: 1, unit: "%" },
      { key: "synapse", label: "Sinaps o'tkazuvchanligi", min: 0, max: 100, step: 1, unit: "%" },
      { key: "speed", label: "Impuls tezligi", min: 10, max: 100, step: 1, unit: "%" },
    ],
    badges: ["Neyron", "Sinaps", "Impuls"],
    steps: ["Stimulyatsiyani oshiring.", "Impuls to'lqinini kuzating.", "Sinaps orqali uzatilish tezligini solishtiring."],
    metrics: (v) => [
      { label: "Impuls kuchi", value: `${(v.stimulus * 0.7 + v.synapse * 0.3).toFixed(0)} %` },
      { label: "Uzatilish vaqti", value: `${(12 - v.speed / 10).toFixed(1)} ms` },
      { label: "Faollik", value: `${Math.min(100, v.stimulus * 0.5 + v.speed * 0.5).toFixed(0)} %` },
    ],
    insight: (v) =>
      v.synapse < 30
        ? "Sinaps o'tkazuvchanligi past bo'lsa signal uzatish sustlashadi."
        : "Stimulyatsiya kuchli bo'lsa impuls neyron bo'ylab tez va aniq uzatiladi.",
  },
  "qon-tizimi": {
    title: "Qon aylanishi",
    summary: "Yurak urishi, tomir kengligi va kislorod tashilishi qon oqimi tezligi hamda bosimga ta'sir qiladi.",
    mode: "circulation",
    defaults: { heartbeat: 72, vessel: 60, oxygen: 75 },
    controls: [
      { key: "heartbeat", label: "Yurak urishi", min: 40, max: 140, step: 1, unit: "bpm" },
      { key: "vessel", label: "Tomir kengligi", min: 20, max: 100, step: 1, unit: "%" },
      { key: "oxygen", label: "Kislorod darajasi", min: 20, max: 100, step: 1, unit: "%" },
    ],
    badges: ["Yurak", "Qon oqimi", "Kislorod tashilishi"],
    steps: ["Yurak urishini o'zgartiring.", "Tomir kengligini kuzating.", "Qon hujayralari oqimini taqqoslang."],
    metrics: (v) => [
      { label: "Qon oqimi", value: `${(v.heartbeat * v.vessel / 100).toFixed(0)} %` },
      { label: "Kislorod tashish", value: `${(v.oxygen * 0.9).toFixed(0)} %` },
      { label: "Bosim", value: `${(70 + v.heartbeat * 0.35 - (100 - v.vessel) * 0.2).toFixed(0)} mmHg` },
    ],
    insight: (v) =>
      v.vessel < 35
        ? "Tomir toraysa oqimga qarshilik ortadi."
        : "Yurak urishi va kislorod darajasi birgalikda to'qimalarning oziqlanishiga xizmat qiladi.",
  },
  "genetik-analiz": {
    title: "Genetik ozgarishlar va irsiyat",
    summary: "Dominant va retsessiv allellar kombinatsiyasi fenotip va ehtimollik natijalarini o'zgartiradi.",
    mode: "genetics",
    defaults: { dominant: 70, mutation: 15, inheritance: 60 },
    controls: [
      { key: "dominant", label: "Dominant allel", min: 0, max: 100, step: 1, unit: "%" },
      { key: "mutation", label: "Mutatsiya", min: 0, max: 100, step: 1, unit: "%" },
      { key: "inheritance", label: "Nasldan o'tish", min: 0, max: 100, step: 1, unit: "%" },
    ],
    badges: ["Gen", "Dominant/retsessiv", "Punnett mantiqi"],
    steps: ["Dominant allel ulushini tanlang.", "Mutatsiya ta'sirini oshiring.", "Fenotip natijasini kuzating."],
    metrics: (v) => [
      { label: "Dominant fenotip", value: `${(v.dominant * 0.75).toFixed(0)} %` },
      { label: "Mutatsiya xavfi", value: `${v.mutation.toFixed(0)} %` },
      { label: "Nasliy o'tish", value: `${(v.inheritance * 0.8).toFixed(0)} %` },
    ],
    insight: (v) =>
      v.mutation > 50
        ? "Mutatsiya ehtimoli katta bo'lsa gen ifodalanishi o'zgarishi mumkin."
        : "Dominant allel ko'proq bo'lsa fenotipda shu belgi tez-tez uchraydi.",
  },
  "oziq-energiya": {
    title: "Oziq-energiya davri",
    summary: "Oziq moddalar va energiya bosqichma-bosqich uzatilganda trofik darajalar bo'yicha yo'qotish ham yuz beradi.",
    mode: "food",
    defaults: { producers: 80, consumers: 55, loss: 35 },
    controls: [
      { key: "producers", label: "Produsentlar", min: 10, max: 100, step: 1, unit: "%" },
      { key: "consumers", label: "Konsumentlar", min: 10, max: 100, step: 1, unit: "%" },
      { key: "loss", label: "Energiya yo'qotish", min: 5, max: 80, step: 1, unit: "%" },
    ],
    badges: ["Energiya piramidasi", "Produsent", "Konsument"],
    steps: ["Produsentlar miqdorini tanlang.", "Konsumentlar sonini o'zgartiring.", "Energiya bosqichma-bosqich kamayishini kuzating."],
    metrics: (v) => [
      { label: "1-bosqich energiya", value: `${(v.producers * 1.2).toFixed(0)} birlik` },
      { label: "2-bosqich energiya", value: `${(v.producers * (100 - v.loss) / 100).toFixed(0)} birlik` },
      { label: "3-bosqich energiya", value: `${(v.consumers * (100 - v.loss) / 160).toFixed(0)} birlik` },
    ],
    insight: (v) =>
      v.loss > 50
        ? "Energiya yo'qotish katta bo'lsa yuqori trofik bosqichlargacha kamroq energiya yetib boradi."
        : "Produsentlar ko'p bo'lsa oziq zanjirining qolgan bosqichlari yaxshiroq qo'llab-quvvatlanadi.",
  },
  mikroorganizmlar: {
    title: "Mikroorganizmlar va antibiotiklar",
    summary: "Antibiotik kuchi oshsa bakteriyalar koloniyasi qisqaradi, lekin chidamli hujayralar saqlanib qolishi mumkin.",
    mode: "microbe",
    defaults: { bacteria: 80, antibiotic: 55, resistance: 30 },
    controls: [
      { key: "bacteria", label: "Bakteriya soni", min: 10, max: 100, step: 1, unit: "%" },
      { key: "antibiotic", label: "Antibiotik kuchi", min: 0, max: 100, step: 1, unit: "%" },
      { key: "resistance", label: "Chidamlilik", min: 0, max: 100, step: 1, unit: "%" },
    ],
    badges: ["Koloniya", "Antibiotik", "Chidamlilik"],
    steps: ["Bakteriya koloniyasini tanlang.", "Antibiotik kuchini oshiring.", "Chidamli hujayralar qanchasi saqlanishini kuzating."],
    metrics: (v) => [
      { label: "Koloniya maydoni", value: `${Math.max(0, v.bacteria - v.antibiotic * 0.7 + v.resistance * 0.4).toFixed(0)} %` },
      { label: "Antibiotik ta'siri", value: `${(v.antibiotic * 0.9).toFixed(0)} %` },
      { label: "Chidamli qism", value: `${(v.resistance * 0.8).toFixed(0)} %` },
    ],
    insight: (v) =>
      v.antibiotic > 70 && v.resistance < 30
        ? "Antibiotik kuchli. Koloniya tez qisqaradi."
        : "Chidamlilik oshsa bakteriyalarning bir qismi saqlanib qoladi.",
  },
};
