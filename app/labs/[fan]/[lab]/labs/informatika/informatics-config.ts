export type InformaticsMode =
  | "complexity"
  | "structures"
  | "recursion"
  | "graph"
  | "crypto"
  | "number"
  | "security"
  | "ai"
  | "database"
  | "parallel";

export type InformaticsControl = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
};

export type InformaticsMetric = {
  label: string;
  value: string;
};

export type InformaticsLabDefinition = {
  title: string;
  summary: string;
  mode: InformaticsMode;
  defaults: Record<string, number>;
  controls: InformaticsControl[];
  badges: string[];
  steps: string[];
  metrics: (values: Record<string, number>) => InformaticsMetric[];
  insight: (values: Record<string, number>) => string;
};

export const informaticsLabs: Record<string, InformaticsLabDefinition> = {
  "algoritm-tahlil": {
    title: "Algoritm tahlili va murakkablik",
    summary: "O(n), O(n log n) va O(n^2) algoritmlarining bajarilish o'sishini bir sahnada solishtiring.",
    mode: "complexity",
    defaults: { size: 60, optimization: 55, dataflow: 65 },
    controls: [
      { key: "size", label: "Ma'lumot hajmi", min: 10, max: 100, step: 1, unit: "%" },
      { key: "optimization", label: "Optimizatsiya", min: 0, max: 100, step: 1, unit: "%" },
      { key: "dataflow", label: "Oqim tezligi", min: 10, max: 100, step: 1, unit: "%" },
    ],
    badges: ["O(n)", "O(n log n)", "O(n^2)"],
    steps: ["Hajmni oshiring.", "Uchta ustun balandligini solishtiring.", "Optimizatsiya natijasini kuzating."],
    metrics: (v) => [
      { label: "O(n)", value: `${(v.size * 0.9).toFixed(0)} ms` },
      { label: "O(n log n)", value: `${(v.size * 1.25 - v.optimization * 0.2).toFixed(0)} ms` },
      { label: "O(n^2)", value: `${((v.size * v.size) / 18).toFixed(0)} ms` },
    ],
    insight: (v) =>
      v.size > 70
        ? "Hajm katta bo'lsa murakkab algoritmlar juda tez sekinlashadi."
        : "Kichik hajmda farq kam ko'rinadi, lekin katta ma'lumotda tafovut keskinlashadi.",
  },
  "malumot-struct": {
    title: "Ma'lumot strukturalari",
    summary: "Stack, queue va binary tree elementlari qanday joylashib, qanday ishlashini animatsiya orqali ko'ring.",
    mode: "structures",
    defaults: { nodes: 50, depth: 55, operations: 60 },
    controls: [
      { key: "nodes", label: "Elementlar soni", min: 10, max: 100, step: 1, unit: "%" },
      { key: "depth", label: "Daraxt chuqurligi", min: 10, max: 100, step: 1, unit: "%" },
      { key: "operations", label: "Operatsiya tezligi", min: 10, max: 100, step: 1, unit: "%" },
    ],
    badges: ["Stack", "Queue", "Tree"],
    steps: ["Elementlar sonini tanlang.", "Daraxt chuqurligini oshiring.", "Joylashuvni taqqoslang."],
    metrics: (v) => [
      { label: "Stack push/pop", value: `${(v.operations * 0.8).toFixed(0)} ops` },
      { label: "Queue front", value: `${(v.nodes * 0.6).toFixed(0)} element` },
      { label: "Tree height", value: `${(2 + v.depth / 18).toFixed(0)} daraja` },
    ],
    insight: () => "Har bir struktura ma'lumotni boshqacha usulda saqlaydi va qidiradi.",
  },
  rekursiya: {
    title: "Rekursiya va backtracking",
    summary: "Rekursiv chaqiriqlar daraxti kengayib, keyin qaytib kelishini vizual tarzda kuzating.",
    mode: "recursion",
    defaults: { depth: 45, branching: 40, speed: 55 },
    controls: [
      { key: "depth", label: "Chuqurlik", min: 10, max: 100, step: 1, unit: "%" },
      { key: "branching", label: "Tarmoqlanish", min: 10, max: 100, step: 1, unit: "%" },
      { key: "speed", label: "Animatsiya tezligi", min: 10, max: 100, step: 1, unit: "%" },
    ],
    badges: ["Recursive call", "Base case", "Backtracking"],
    steps: ["Chuqurlikni oshiring.", "Tarmoqlanishni kuzating.", "Qaytish bosqichini aniqlang."],
    metrics: (v) => [
      { label: "Call count", value: `${(v.depth * v.branching / 20).toFixed(0)}` },
      { label: "Stack use", value: `${(v.depth * 0.7).toFixed(0)} %` },
      { label: "Base case", value: `${Math.max(1, 10 - v.depth / 12).toFixed(0)} qadam` },
    ],
    insight: (v) =>
      v.depth > 70
        ? "Rekursiya chuqurlashgani sari stack yuklanishi oshadi."
        : "Base case aniq bo'lsa rekursiya boshqarilishi oson bo'ladi.",
  },
  "grafik-algoritmlar": {
    title: "Graf algoritmlari",
    summary: "Graf tugunlari orasida BFS, DFS va qisqa yo'l qidiruvi qanday farq qilishini ko'ring.",
    mode: "graph",
    defaults: { nodes: 55, edges: 65, search: 50 },
    controls: [
      { key: "nodes", label: "Tugunlar", min: 10, max: 100, step: 1, unit: "%" },
      { key: "edges", label: "Bog'lanishlar", min: 10, max: 100, step: 1, unit: "%" },
      { key: "search", label: "Qidiruv tezligi", min: 10, max: 100, step: 1, unit: "%" },
    ],
    badges: ["BFS", "DFS", "Shortest path"],
    steps: ["Tugunlar sonini tanlang.", "Bog'lanishlarni ko'paytiring.", "Yoritilgan yo'llarni solishtiring."],
    metrics: (v) => [
      { label: "Visited nodes", value: `${(v.nodes * 0.8).toFixed(0)}` },
      { label: "Shortest path", value: `${Math.max(2, 12 - v.edges / 12).toFixed(0)} qadam` },
      { label: "Connectivity", value: `${(v.edges * 0.9).toFixed(0)} %` },
    ],
    insight: () => "BFS qatlamlab qidiradi, DFS esa chuqurlikka qarab harakat qiladi.",
  },
  kriptografiya: {
    title: "Kriptografiya asoslari",
    summary: "Matn bloklari shifrlanib, kalit yordamida yangi ko'rinishga o'tishini 3D bloklar orqali kuzating.",
    mode: "crypto",
    defaults: { key: 55, rounds: 45, entropy: 60 },
    controls: [
      { key: "key", label: "Kalit kuchi", min: 10, max: 100, step: 1, unit: "%" },
      { key: "rounds", label: "Roundlar", min: 1, max: 100, step: 1, unit: "ta" },
      { key: "entropy", label: "Entropiya", min: 10, max: 100, step: 1, unit: "%" },
    ],
    badges: ["Plaintext", "Ciphertext", "Key"],
    steps: ["Kalit kuchini oshiring.", "Roundlar sonini ko'paytiring.", "Bloklar rang almashuvini kuzating."],
    metrics: (v) => [
      { label: "Kalit kuchi", value: `${(v.key * 1.28).toFixed(0)} bit` },
      { label: "Shifrlash roundi", value: `${v.rounds.toFixed(0)}` },
      { label: "Tahminiy xavfsizlik", value: `${Math.min(99, v.key * 0.5 + v.entropy * 0.4).toFixed(0)} %` },
    ],
    insight: () => "Kalit va roundlar ortgani sari shifrlangan bloklar tartibsizroq ko'rinadi.",
  },
  "sanoq-analiz": {
    title: "Sanoq tizimlari",
    summary: "Bir xil qiymat binary, decimal va hex ko'rinishida bir vaqtning o'zida aks etadi.",
    mode: "number",
    defaults: { value: 48, bits: 8, shift: 3 },
    controls: [
      { key: "value", label: "Qiymat", min: 0, max: 100, step: 1, unit: "" },
      { key: "bits", label: "Bitlar", min: 4, max: 16, step: 1, unit: "bit" },
      { key: "shift", label: "Siljitish", min: 0, max: 8, step: 1, unit: "bit" },
    ],
    badges: ["Binary", "Decimal", "Hex"],
    steps: ["Qiymatni tanlang.", "Bitlar sonini o'zgartiring.", "Bit shift ta'sirini kuzating."],
    metrics: (v) => [
      { label: "Decimal", value: `${v.value.toFixed(0)}` },
      { label: "Binary", value: `${Math.round(v.value).toString(2).padStart(Math.round(v.bits), "0").slice(-Math.round(v.bits))}` },
      { label: "Hex", value: `0x${Math.round(v.value).toString(16).toUpperCase()}` },
    ],
    insight: () => "Bir xil ma'lumot turli sanoq tizimlarida turlicha yoziladi, lekin qiymati bir xil qoladi.",
  },
  "veb-xavfsizlik": {
    title: "Veb xavfsizlik",
    summary: "So'rovlar filtri, input tozalash va himoya qatlami bo'lsa xavfli trafik qanday kamayishini ko'ring.",
    mode: "security",
    defaults: { attacks: 65, firewall: 55, sanitize: 60 },
    controls: [
      { key: "attacks", label: "Hujumlar oqimi", min: 10, max: 100, step: 1, unit: "%" },
      { key: "firewall", label: "Firewall", min: 0, max: 100, step: 1, unit: "%" },
      { key: "sanitize", label: "Input tozalash", min: 0, max: 100, step: 1, unit: "%" },
    ],
    badges: ["Attack", "Filter", "Safe requests"],
    steps: ["Hujum oqimini oshiring.", "Firewall himoyasini kuchaytiring.", "Xavfsiz va xavfli paketlarni taqqoslang."],
    metrics: (v) => [
      { label: "To'silgan so'rov", value: `${Math.min(100, v.firewall * 0.6 + v.sanitize * 0.4).toFixed(0)} %` },
      { label: "Xavf qoldig'i", value: `${Math.max(0, v.attacks - v.firewall * 0.5 - v.sanitize * 0.35).toFixed(0)} %` },
      { label: "Safe traffic", value: `${Math.max(0, 100 - v.attacks * 0.4 + v.firewall * 0.3).toFixed(0)} %` },
    ],
    insight: () => "Firewall va input validatsiya birga ishlasa xavfli trafik ancha kamayadi.",
  },
  "suniy-intellekt": {
    title: "Suniy intellekt va neyron tarmoq",
    summary: "Kirish nuqtalari, yashirin qatlam va vaznlar o'zgarishi bilan qaror chegarasi qanday siljishini kuzating.",
    mode: "ai",
    defaults: { neurons: 55, learning: 45, data: 70 },
    controls: [
      { key: "neurons", label: "Neyronlar", min: 10, max: 100, step: 1, unit: "%" },
      { key: "learning", label: "Learning rate", min: 10, max: 100, step: 1, unit: "%" },
      { key: "data", label: "Data sifati", min: 10, max: 100, step: 1, unit: "%" },
    ],
    badges: ["Input", "Hidden layer", "Decision boundary"],
    steps: ["Neyronlar sonini oshiring.", "Learning rate ni o'zgartiring.", "Nuqtalar ajralishini kuzating."],
    metrics: (v) => [
      { label: "Accuracy", value: `${Math.min(99, v.data * 0.55 + v.neurons * 0.25 + v.learning * 0.15).toFixed(0)} %` },
      { label: "Loss", value: `${Math.max(0.05, 1.2 - v.learning / 110 - v.data / 180).toFixed(2)}` },
      { label: "Model size", value: `${(v.neurons * 1.8).toFixed(0)} param` },
    ],
    insight: () => "Data sifati yaxshi bo'lsa model tezroq va barqarorroq o'rganadi.",
  },
  "malumotlar-bazasi": {
    title: "Ma'lumotlar bazasi va so'rovlar",
    summary: "Jadvallar, bog'lanishlar va so'rov oqimi orasidagi aloqani 3D bloklar orqali ko'ring.",
    mode: "database",
    defaults: { tables: 45, relations: 55, query: 60 },
    controls: [
      { key: "tables", label: "Jadvallar", min: 10, max: 100, step: 1, unit: "%" },
      { key: "relations", label: "Bog'lanishlar", min: 10, max: 100, step: 1, unit: "%" },
      { key: "query", label: "So'rov yuklamasi", min: 10, max: 100, step: 1, unit: "%" },
    ],
    badges: ["Table", "Relation", "Query"],
    steps: ["Jadvallar sonini oshiring.", "Bog'lanishlarni ko'paytiring.", "So'rov oqimining harakatini kuzating."],
    metrics: (v) => [
      { label: "Join murakkabligi", value: `${(v.tables * 0.6 + v.relations * 0.5).toFixed(0)} %` },
      { label: "Query time", value: `${(v.query * 0.9 + v.relations * 0.3).toFixed(0)} ms` },
      { label: "Index foydasi", value: `${Math.max(0, 100 - v.query * 0.3).toFixed(0)} %` },
    ],
    insight: () => "Bog'lanishlar ko'paygani sari so'rovlarni optimallashtirish muhimlashadi.",
  },
  "parallel-hisoblash": {
    title: "Parallel hisoblash",
    summary: "Bir vazifa bir nechta oqimga bo'linganda vaqt qanday qisqarishini va sinxronlash xarajatini kuzating.",
    mode: "parallel",
    defaults: { threads: 4, workload: 70, sync: 35 },
    controls: [
      { key: "threads", label: "Threadlar", min: 1, max: 16, step: 1, unit: "ta" },
      { key: "workload", label: "Yuklama", min: 10, max: 100, step: 1, unit: "%" },
      { key: "sync", label: "Sinxronlash", min: 0, max: 100, step: 1, unit: "%" },
    ],
    badges: ["Thread", "Workload", "Sync overhead"],
    steps: ["Threadlar sonini oshiring.", "Yuklamani taqsimlanishini kuzating.", "Sync overhead natijasini solishtiring."],
    metrics: (v) => [
      { label: "Sequential time", value: `${(v.workload * 1.3).toFixed(0)} ms` },
      { label: "Parallel time", value: `${Math.max(8, v.workload * 1.2 / Math.max(v.threads, 1) + v.sync * 0.5).toFixed(0)} ms` },
      { label: "Speedup", value: `${Math.max(1, (v.workload * 1.3) / Math.max(8, v.workload * 1.2 / Math.max(v.threads, 1) + v.sync * 0.5)).toFixed(2)}x` },
    ],
    insight: (v) =>
      v.sync > 60
        ? "Sinxronlash xarajati katta bo'lsa threadlar ko'paygani bilan foyda kamayadi."
        : "Yuklama yaxshi bo'linsa parallel ishlash sezilarli tezlashuv beradi.",
  },
};
