"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type MissionId = "guruh-chat" | "dost-kayfiyati" | "imtihon-siri" | "soxta-xabar" | "jamoa-xavf";
type WorldTargetId =
  | "classmate"
  | "friend"
  | "teacher"
  | "news-guide"
  | "team-lead"
  | "team-member-one"
  | "team-member-two"
  | "source-terminal"
  | "evidence-board";

type MissionChoice = {
  label: string;
  outcome: string;
};

type MissionStage = {
  targetId: WorldTargetId;
  speaker: string;
  prompt: string;
  choices: MissionChoice[];
};

type Mission = {
  id: MissionId;
  title: string;
  targetId: WorldTargetId;
  reward: string;
  xp: number;
  stages: MissionStage[];
};

type Progress = {
  version: 1;
  xp: number;
  completed: MissionId[];
  steps: Partial<Record<MissionId, number>>;
  reflections: Partial<Record<MissionId, string>>;
  inventory: string[];
  position: { x: number; y: number };
};

type Dialogue = {
  missionId: MissionId;
  choice?: MissionChoice;
  reflection?: boolean;
};

type Target = {
  id: WorldTargetId;
  name: string;
  x: number;
  y: number;
  kind: "npc" | "object";
  missionId?: MissionId;
  color?: string;
  title?: string;
};

const SAVE_KEY = "z-avlod-hayot-simulator-v2";
const WORLD_WIDTH = 1800;
const WORLD_HEIGHT = 1200;
const PLAYER_RADIUS = 15;
const MOVE_SPEED = 210;

const missions: Mission[] = [
  {
    id: "guruh-chat",
    title: "Guruh chatidagi mojaro",
    targetId: "classmate",
    reward: "Do‘stlik va ishonch nishoni",
    xp: 100,
    stages: [
      {
        targetId: "classmate",
        speaker: "Kamol · sinfdosh",
        prompt: "Guruh chatida Madinaning ruxsatisiz olingan rasmi tarqaldi. Kimdir ustidan kulmoqda. Hozir nima qilasan?",
        choices: [
          { label: "Madinadan hol-ahvol so‘rab, yonida ekanimni bildiraman", outcome: "Madinaga yolg‘iz emasligini bildirding. U biroz tinchlandi va nima yordam kerakligini aytishga tayyor." },
          { label: "Hech narsa yozmay, chatni kuzataman", outcome: "Mojaro darhol to‘xtamadi. Jimlik ham vaziyatga ta’sir qilishini sezib, keyingi qadamni o‘ylab ko‘rishing mumkin." },
          { label: "Masxaraga qo‘shilib, rasmni ulashaman", outcome: "Rasm yana ko‘proq odamga yetib bordi va Madinaga og‘ir botdi. Endi tarqatishni to‘xtatish va zararni kamaytirish imkoning bor." },
        ],
      },
      {
        targetId: "classmate",
        speaker: "Kamol · sinfdosh",
        prompt: "Madinaning surati hali ham chatda. Uni tarqatishni to‘xtatish uchun qanday yo‘l tutasan?",
        choices: [
          { label: "Rasmni o‘chirishni so‘rab, boshqalarga ulashmaslikni eslataman", outcome: "Guruhga aniq va hurmatli chegara qo‘yding. Bir necha kishi rasmni o‘chirdi." },
          { label: "Madinadan avval o‘zi nima xohlashini so‘rayman", outcome: "Madinaning tanlovini hurmat qilding. U o‘ziga mos yordamni aytib, vaziyatni boshqarishda ishtirok etdi." },
          { label: "Chatdan chiqib ketaman", outcome: "O‘zingni noqulay suhbatdan chetga olding, lekin rasm tarqalishda davom etishi mumkin. Yordam so‘rash yana bir imkoniyat." },
        ],
      },
      {
        targetId: "classmate",
        speaker: "Kamol · sinfdosh",
        prompt: "Vaziyat jiddiylashdi. Madina bilan birga xavfsiz yordam yo‘lini tanlang.",
        choices: [
          { label: "Ishonchli o‘qituvchi yoki moderatorga xabar beraman", outcome: "Mas’uliyatli kattani jalb qilding. U rasm tarqalishini to‘xtatish va Madinani qo‘llashga yordam beradi." },
          { label: "Madinaga yonida qolishni va xabarlarni saqlashda yordam beraman", outcome: "Madinaning roziligi bilan dalillarni saqlashga va uni qo‘llab-quvvatlashga yordam berding." },
          { label: "Vaziyat jiddiy bo’lsa, ishonchli kattadan yordam so‘rayman", outcome: "Do‘stni himoya qilish niyating tushunarli. Lekin vaziyat jiddiy bo’lsa, ishonchli kattadan yordam so‘rash ham mumkin." },
        ],
      },
    ],
  },
  {
    id: "dost-kayfiyati",
    title: "Do‘stimning kayfiyati",
    targetId: "friend",
    reward: "Mehribon tinglovchi nishoni",
    xp: 100,
    stages: [
      {
        targetId: "friend",
        speaker: "Diyor · do‘sting",
        prompt: "Diyor bugun odatdagidan ancha jim. U ko‘zini olib qochdi: “Hozir gaplashgim kelmayapti”, dedi. Nima qilasan?",
        choices: [
          { label: "“Tushunarli. Xohlasang, yoningda o‘tiraman” deyman", outcome: "Diyorga bosim qilmay, yonida ekaningni ko‘rsatding. U o‘zini xavfsizroq his qildi." },
          { label: "Darrov nima bo‘lganini so‘rab, javob talab qilaman", outcome: "Yordam berishni xohlading, ammo shoshiltirish Diyorni yanada yopiq qilishi mumkin. Unga vaqt berish foydali." },
          { label: "Mavzuni ozgartirib, kayfiyatini kotarishga urinaman", outcome: "Diyor biroz chalgishi mumkin, ammo hislarini aytishga tayyor bolsa, uni tinglash uchun imkon qoldir." },
        ],
      },
      {
        targetId: "friend",
        speaker: "Diyor · do‘sting",
        prompt: "Diyor birozdan so‘ng gapira boshladi. Unga qanday yordam taklif qilasan?",
        choices: [
          { label: "Maslahat berishga shoshmay, diqqat bilan tinglayman", outcome: "Diyor o‘zini eshitilgan his qildi. Ba’zan e’tibor bilan tinglashning o‘zi katta yordam." },
          { label: "Nima kerakligini so‘rab, yordam variantlarini birga tanlayman", outcome: "Yordamni Diyorning ehtiyojiga mos tanlading va uning qarorini hurmat qilding." },
          { label: "Vaziyat ogir bolsa, ishonchli kattaga birga murojaat qilishni taklif qilaman", outcome: "Diyor yolgiz qolmadi: kerak bolsa, ishonchli kattadan birga yordam sorash mumkin." },
        ],
      },
    ],
  },
  {
    id: "imtihon-siri",
    title: "Imtihondagi sir",
    targetId: "teacher",
    reward: "Halollik va izlanish nishoni",
    xp: 100,
    stages: [
      {
        targetId: "teacher",
        speaker: "Saida opa · o‘qituvchi",
        prompt: "Do‘sting nazorat ishiga tayyor javoblarni yubordi. U: “Shunchaki ko‘chir, hech kim bilmaydi”, deyapti. Qanday javob berasan?",
        choices: [
          { label: "Ko‘chirmayman, tushunmagan mavzuni tushuntirib berishini so‘rayman", outcome: "Yordamni ko‘chirishga emas, o‘rganishga yo‘naltirding. Do‘sting mavzuni birga ko‘rib chiqishga rozi." },
          { label: "Javoblarni ko‘chirib, keyin o‘rganishga va’da beraman", outcome: "Tez yechim bahoni oshirishi mumkin, ammo bilimdagi bo‘shliq qoladi. Mustaqil mashq qilishga qaytish mumkin." },
          { label: "O‘qituvchidan mavzu bo‘yicha qo‘shimcha tushuntirish so‘rayman", outcome: "Qiyinchilikni yashirmay sorading. Oqituvchi mavzuni tushunishga yordam beradi." },
        ],
      },
      {
        targetId: "teacher",
        speaker: "Saida opa · o‘qituvchi",
        prompt: "Topshiriqni mustaqil tushunish uchun qaysi reja senga mos?",
        choices: [
          { label: "Qiyin savollarni belgilab, har birini o‘zim ishlab ko‘raman", outcome: "Aniq reja tuzding. O‘qituvchi tekshirib, xatolaringni tushuntirishga tayyor." },
          { label: "Do‘stim bilan yechim yo‘lini muhokama qilaman, javobni o‘zim yozaman", outcome: "Hamkorlik qilding va yakuniy ishni ozing bajarding. Bu tushunchani mustahkamlaydi." },
          { label: "Vaqt oz qolgan bolsa, oqituvchidan yordam yoki muddat sorayman", outcome: "Vaziyatni rost tushuntirib, yordam sorashing masuliyatli qaror boldi." },
        ],
      },
    ],
  },
  {
    id: "soxta-xabar",
    title: "Soxta xabar",
    targetId: "news-guide",
    reward: "Axborot izquvari nishoni",
    xp: 120,
    stages: [
      {
        targetId: "news-guide",
        speaker: "Aziz · axborot markazi",
        prompt: "Shaharda maktab yopilishi haqida xabar tarqaldi. Xabar muallifi noma’lum. Uni darrov ulashasanmi?",
        choices: [
          { label: "Hozircha ulashmay, avval manbasini tekshiraman", outcome: "Shoshilmay turding. Tekshirilmagan xabarni tarqatmaslik vahimani kamaytiradi." },
          { label: "Xabarni tekshirmasdan tarqataman", outcome: "Tez ulashish vahimani kuchaytirishi va ishonchga putur yetkazishi mumkin. Manbani avval tekshirishga qaytishing mumkin." },
        ],
      },
      {
        targetId: "source-terminal",
        speaker: "Axborot manbalari terminali",
        prompt: "Uch manbani solishtir: anonim kanal muallifsiz; maktabning rasmiy sahifasi bugun yangilangan; tanishing esa asl manbani ko‘rsatmagan. Qaysi manbani tekshirasan?",
        choices: [
          { label: "Bugungi sanali, maktabning rasmiy sahifasini tekshiraman", outcome: "Manbaning kimga tegishli ekanini va sanasini tekshirding. Bu ishonchli boshlang‘ich dalil." },
          { label: "Ko‘p odam ulashgan anonim kanalga ishonaman", outcome: "Ko‘p ulashilgani xabarning rostligini bildirmaydi. Muallif va dalilni izlashga qaytishing mumkin." },
          { label: "Tanishim yuborgan xabarni dalilsiz qabul qilaman", outcome: "Tanish odam ham beixtiyor xato xabar yuborishi mumkin. Asl manbaga qaytib tekshirish foydali." },
        ],
      },
      {
        targetId: "evidence-board",
        speaker: "Dalillar doskasi",
        prompt: "Rasmiy maktab sahifasida darslar odatdagidek davom etishi yozilgan. Boshqa tasdiqli manba topilmadi. Endi nima qilasan?",
        choices: [
          { label: "Rasmiy xabarni solishtirib, tasdiqlanmagan xabarni tarqatmayman", outcome: "Ikki dalilni taqqoslab, tekshirilmagan xabarni cheklading. Shahardagi ishonch saqlanib qoldi." },
          { label: "Ikkala xabarni ham izohsiz ulashib, odamlar o‘zlari tanlasin deyman", outcome: "Qarama-qarshi xabarlarni izohsiz ulashish chalkashlik tug‘dirishi mumkin. Manba va sana bilan aniqlik kiritish yaxshiroq." },
        ],
      },
    ],
  },
  {
    id: "jamoa-xavf",
    title: "Jamoa xavf ostida",
    targetId: "team-lead",
    reward: "Jamoa hamkori nishoni",
    xp: 120,
    stages: [
      {
        targetId: "team-lead",
        speaker: "Malika · jamoa yetakchisi",
        prompt: "Loyiha muddati yaqin. Ikki kishi ishning ko‘p qismini bajaryapti, boshqalar esa ortda qoldi. Nimadan boshlaysan?",
        choices: [
          { label: "Hamma bilan qisqa yig‘ilish qilib, kimga nima to‘siq bo‘layotganini so‘rayman", outcome: "Ayblashdan oldin jamoaning ehtiyojini bilishga qaror qilding. Endi a’zolarni tinglaymiz." },
          { label: "Ishlamayotgan jamoa a’zolarini darrov ayblayman", outcome: "Ayblash jamoaning haqiqiy to‘siqlarini aniqlashga xalaqit berishi mumkin. Avval tinglab, sabablarni birga aniqlang." },
        ],
      },
      {
        targetId: "team-member-one",
        speaker: "Jasur · jamoa a’zosi",
        prompt: "Jasur: Men slayd tayyorlay olaman, ammo vazifalar ustma-ust tushganini bilmagandim. Uning fikrini qanday hisobga olasan?",
        choices: [
          { label: "Uning imkonini so‘rab, slayd vazifasini aniq kelishib olaman", outcome: "Jasurning kuchli tomonini aniqlab, unga tushunarli vazifa berding." },
          { label: "Hamma bir xil ishni qilsin deb, vazifani o‘zgartirmayman", outcome: "Bir xil taqsimot har bir kishining imkoniyati va ehtiyojini hisobga olmasligi mumkin." },
        ],
      },
      {
        targetId: "team-member-two",
        speaker: "Zarina · jamoa a’zosi",
        prompt: "Zarina: Bir qismda yordam kerak, lekin so‘rashga uyaldim. Jamoa qanday javob beradi?",
        choices: [
          { label: "Yordam juftligini tuzib, yakuniy muddatni birga belgilaymiz", outcome: "Zarinaga yordam va aniq muddat taklif qilding. U jamoaga qo‘shilish uchun yo‘l topdi." },
          { label: "Ulgurmasa, uning qismini hamma oxirida bajaradi deyman", outcome: "Bu yechim boshqalarga qoshimcha yuk bolishi mumkin. Yordam va vazifa hajmini birga kelishib olish mumkin." },
        ],
      },
      {
        targetId: "team-lead",
        speaker: "Malika · jamoa yetakchisi",
        prompt: "Endi vazifalarni adolatli taqsimlang. Qanday kelishuv jamoani umumiy natija uchun mas’ul qiladi?",
        choices: [
          { label: "Vazifani qobiliyat va vaqtga qarab bo‘lib, holatni qayta tekshiramiz", outcome: "Jamoa kelishilgan vazifalar, yordam va tekshiruv vaqtiga ega bo‘ldi." },
          { label: "Eng tez ishlaydigan ikki kishiga hamma ishni topshiramiz", outcome: "Tezroq tugashi mumkin, ammo yuklama adolatsiz qoladi. Vazifalarni birga taqsimlab, yordamni kelishib olish mumkin." },
        ],
      },
    ],
  },
];

const targets: Target[] = [
  { id: "classmate", name: "Kamol · sinfdosh", x: 460, y: 470, kind: "npc", missionId: "guruh-chat", color: "#38bdf8" },
  { id: "friend", name: "Diyor · do‘st", x: 790, y: 405, kind: "npc", missionId: "dost-kayfiyati", color: "#f472b6" },
  { id: "teacher", name: "Saida opa · o‘qituvchi", x: 455, y: 825, kind: "npc", missionId: "imtihon-siri", color: "#fbbf24" },
  { id: "news-guide", name: "Aziz · axborot markazi", x: 1450, y: 445, kind: "npc", missionId: "soxta-xabar", color: "#34d399" },
  { id: "team-lead", name: "Malika · jamoa yetakchisi", x: 980, y: 730, kind: "npc", missionId: "jamoa-xavf", color: "#a78bfa" },
  { id: "team-member-one", name: "Jasur · jamoa a’zosi", x: 1015, y: 825, kind: "npc", color: "#60a5fa" },
  { id: "team-member-two", name: "Zarina · jamoa a’zosi", x: 1035, y: 990, kind: "npc", color: "#fb7185" },
  { id: "source-terminal", name: "Manbalar terminali", x: 1555, y: 310, kind: "object", title: "MANBALAR" },
  { id: "evidence-board", name: "Dalillar doskasi", x: 1310, y: 295, kind: "object", title: "DALILLAR" },
];

const obstacles = [
  { x: 80, y: 85, width: 340, height: 190 },
  { x: 680, y: 90, width: 230, height: 145 },
  { x: 1270, y: 85, width: 360, height: 190 },
  { x: 75, y: 705, width: 330, height: 190 },
  { x: 680, y: 690, width: 250, height: 170 },
  { x: 1280, y: 715, width: 350, height: 205 },
  { x: 1195, y: 395, width: 100, height: 105 },
  { x: 535, y: 335, width: 65, height: 90 },
  { x: 1090, y: 330, width: 75, height: 95 },
  { x: 430, y: 930, width: 80, height: 60 },
  { x: 1165, y: 915, width: 80, height: 65 },
];

const missionById = new Map(missions.map((mission) => [mission.id, mission]));

function createProgress(): Progress {
  return {
    version: 1,
    xp: 0,
    completed: [],
    steps: {},
    reflections: {},
    inventory: [],
    position: { x: 500, y: 515 },
  };
}

function parseProgress(value: string): Progress {
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== "object") throw new Error("Saqlangan o‘yin ma’lumoti noto‘g‘ri.");
  const data = parsed as Partial<Progress>;
  const validMissionIds = new Set(missions.map((mission) => mission.id));
  const completed = Array.isArray(data.completed)
    ? data.completed.filter((id): id is MissionId => typeof id === "string" && validMissionIds.has(id as MissionId))
    : [];
  const steps: Progress["steps"] = {};

  if (data.steps && typeof data.steps === "object") {
    for (const mission of missions) {
      const step = data.steps[mission.id];
      if (typeof step === "number" && Number.isInteger(step) && step >= 0 && step < mission.stages.length) {
        steps[mission.id] = step;
      }
    }
  }

  const x = Number(data.position?.x);
  const y = Number(data.position?.y);
  return {
    version: 1,
    xp: typeof data.xp === "number" && Number.isFinite(data.xp) && data.xp >= 0 ? data.xp : 0,
    completed,
    steps,
    reflections: data.reflections && typeof data.reflections === "object" ? data.reflections : {},
    inventory: Array.isArray(data.inventory) ? data.inventory.filter((item): item is string => typeof item === "string") : [],
    position: {
      x: Number.isFinite(x) ? Math.min(WORLD_WIDTH - 30, Math.max(30, x)) : 500,
      y: Number.isFinite(y) ? Math.min(WORLD_HEIGHT - 30, Math.max(30, y)) : 515,
    },
  };
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, width, height, radius);
    return;
  }
  const r = Math.min(radius, width / 2, height / 2);
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  ctx.fillStyle = "rgba(16, 35, 32, .18)";
  ctx.beginPath();
  ctx.ellipse(x + 5 * scale, y + 18 * scale, 24 * scale, 12 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#805a3b";
  ctx.fillRect(x - 4 * scale, y + 1 * scale, 9 * scale, 26 * scale);
  ctx.fillStyle = "#166534";
  ctx.beginPath();
  ctx.arc(x, y - 5 * scale, 23 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#22a05a";
  ctx.beginPath();
  ctx.arc(x - 7 * scale, y - 10 * scale, 14 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.16)";
  ctx.beginPath();
  ctx.arc(x - 8 * scale, y - 13 * scale, 5 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawBuilding(ctx: CanvasRenderingContext2D, obstacle: (typeof obstacles)[number], index: number) {
  const palettes = [
    ["#263a68", "#9c7aff", "MAKTAB"],
    ["#1b5960", "#52d3c2", "OROMGOH"],
    ["#233f78", "#67a4ff", "AXBOROT"],
    ["#67512c", "#f6c65b", "ADOLAT"],
    ["#42366d", "#b08aff", "JAMOA"],
    ["#375347", "#74d5a2", "KELAJAK"],
    ["#544172", "#c2a7ff", ""],
    ["#6c5138", "#f1c879", ""],
    ["#315566", "#87d9ef", ""],
    ["#53613d", "#bed08c", ""],
    ["#5c4560", "#e4a8df", ""],
  ];
  const [wall, roof, label] = palettes[index];
  ctx.fillStyle = "rgba(9, 19, 31, .22)";
  roundedRect(ctx, obstacle.x + 8, obstacle.y + 13, obstacle.width, obstacle.height, 20);
  ctx.fill();
  ctx.fillStyle = wall;
  roundedRect(ctx, obstacle.x, obstacle.y + 22, obstacle.width, obstacle.height - 22, 18);
  ctx.fill();
  ctx.fillStyle = roof;
  roundedRect(ctx, obstacle.x - 8, obstacle.y, obstacle.width + 16, 45, 16);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.18)";
  roundedRect(ctx, obstacle.x + 18, obstacle.y + 8, obstacle.width - 36, 5, 3);
  ctx.fill();
  ctx.fillStyle = "rgba(13, 25, 43, .62)";
  roundedRect(ctx, obstacle.x + obstacle.width / 2 - 23, obstacle.y + obstacle.height - 44, 46, 42, 8);
  ctx.fill();
  ctx.fillStyle = "rgba(230,245,255,.72)";
  for (const side of [-1, 1]) {
    roundedRect(ctx, obstacle.x + obstacle.width / 2 + side * (obstacle.width * .28) - 13, obstacle.y + 68, 26, 22, 5);
    ctx.fill();
    roundedRect(ctx, obstacle.x + obstacle.width / 2 + side * (obstacle.width * .28) - 13, obstacle.y + 110, 26, 22, 5);
    ctx.fill();
  }
  if (label) {
    ctx.font = "800 12px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = "#f1f5ff";
    ctx.fillText(label, obstacle.x + obstacle.width / 2, obstacle.y - 12);
  }
}

function drawNpc(ctx: CanvasRenderingContext2D, target: Target, time: number, active: boolean, done: boolean) {
  const bob = Math.sin(time / 240 + target.x) * 1.8;
  const y = target.y + bob;
  ctx.fillStyle = "rgba(11, 22, 34, .24)";
  ctx.beginPath();
  ctx.ellipse(target.x, target.y + 14, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = target.color || "#60a5fa";
  roundedRect(ctx, target.x - 13, y - 1, 26, 29, 10);
  ctx.fill();
  ctx.fillStyle = "#f2c5a5";
  ctx.beginPath();
  ctx.arc(target.x, y - 12, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#23324b";
  ctx.beginPath();
  ctx.arc(target.x, y - 16, 10, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#172033";
  ctx.beginPath();
  ctx.arc(target.x - 3, y - 12, 1, 0, Math.PI * 2);
  ctx.arc(target.x + 3, y - 12, 1, 0, Math.PI * 2);
  ctx.fill();
  if (active || done) {
    ctx.fillStyle = done ? "#34d399" : "#fbbf24";
    ctx.beginPath();
    ctx.arc(target.x + 17, y - 28, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "900 13px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = "#10201d";
    ctx.fillText(done ? "✓" : "!", target.x + 17, y - 23);
  }
  ctx.font = "700 11px system-ui";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(15, 23, 42, .82)";
  roundedRect(ctx, target.x - 68, target.y + 33, 136, 22, 9);
  ctx.fill();
  ctx.fillStyle = "#f8fafc";
  ctx.fillText(target.name.split(" · ")[0], target.x, target.y + 48);
}

function drawTargetObject(ctx: CanvasRenderingContext2D, target: Target) {
  ctx.fillStyle = "rgba(15, 23, 42, .24)";
  ctx.beginPath();
  ctx.ellipse(target.x + 2, target.y + 16, 24, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = target.id === "source-terminal" ? "#2563eb" : "#e7a83d";
  roundedRect(ctx, target.x - 22, target.y - 16, 44, 35, 8);
  ctx.fill();
  ctx.fillStyle = "#d7efff";
  roundedRect(ctx, target.x - 16, target.y - 11, 32, 21, 4);
  ctx.fill();
  ctx.fillStyle = "#34445c";
  ctx.fillRect(target.x - 12, target.y - 5, 24, 2);
  ctx.fillRect(target.x - 12, target.y, 18, 2);
  ctx.fillRect(target.x - 12, target.y + 5, 21, 2);
  ctx.font = "800 9px system-ui";
  ctx.textAlign = "center";
  ctx.fillStyle = "#f8fafc";
  ctx.fillText(target.title || "", target.x, target.y + 33);
}

function isInputTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("input, textarea, select, button, [contenteditable=true]"));
}

export default function HayotGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef({ ...createProgress().position, direction: 0, moving: false });
  const heldKeysRef = useRef(new Set<string>());
  const joystickRef = useRef({ x: 0, y: 0, pointerId: -1 });
  const progressRef = useRef(createProgress());
  const dialogueRef = useRef<Dialogue | null>(null);
  const keysRef = useRef({ paused: false, unlocked: [] as string[] });
  const [progress, setProgress] = useState(createProgress);
  const [loaded, setLoaded] = useState(false);
  const [dialogue, setDialogue] = useState<Dialogue | null>(null);
  const [nearby, setNearby] = useState<Target | null>(null);
  const [toast, setToast] = useState("");
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [stickPosition, setStickPosition] = useState({ x: 0, y: 0 });
  const [reflection, setReflection] = useState("");
  const [showInventory, setShowInventory] = useState(false);
  const canvasShellRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 3200);
  }, []);

  const playTone = useCallback((frequency: number) => {
    if (muted || typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.045, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.16);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.17);
    oscillator.onended = () => void context.close();
  }, [muted]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SAVE_KEY);
      if (saved) {
        const restored = parseProgress(saved);
        progressRef.current = restored;
        playerRef.current.x = restored.position.x;
        playerRef.current.y = restored.position.y;
        setProgress(restored);
      }
    } catch (error) {
      console.error("Hayot simulyatori progressini o‘qib bo‘lmadi:", error);
      showToast("Saqlangan progressni o‘qib bo‘lmadi. Yangi o‘yin boshlandi.");
    } finally {
      setLoaded(true);
    }
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [showToast]);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    dialogueRef.current = dialogue;
  }, [dialogue]);

  const completed = progress.completed;
  const unlocked = [
    "school",
    ...(completed.includes("guruh-chat") ? ["friendship", "digital"] : []),
    ...(completed.includes("dost-kayfiyati") ? ["justice"] : []),
    ...(completed.includes("soxta-xabar") ? ["team"] : []),
    ...(completed.length === missions.length ? ["future"] : []),
  ];
  keysRef.current = { paused, unlocked };

  const getTargetAvailability = useCallback((target: Target, current: Progress) => {
    if (target.missionId) {
      if (current.completed.includes(target.missionId)) return false;
      const mission = missionById.get(target.missionId);
      const currentStep = current.steps[target.missionId];
      if (!mission || currentStep === undefined) return true;
      return mission.stages[currentStep]?.targetId === target.id;
    }
    for (const mission of missions) {
      if (current.completed.includes(mission.id)) continue;
      const step = current.steps[mission.id];
      if (step !== undefined && mission.stages[step]?.targetId === target.id) return true;
    }
    return false;
  }, []);

  const handleInteract = useCallback(() => {
    const target = nearby;
    if (!target || dialogueRef.current || keysRef.current.paused) return;
    if (target.missionId) {
      const mission = missionById.get(target.missionId);
      if (!mission) return;
      const current = progressRef.current;
      if (current.completed.includes(mission.id)) return;
      const next = current.steps[mission.id] ?? 0;
      if (mission.stages[next]?.targetId !== target.id) {
        showToast("Hozir bu qahramon bilan boshqa vazifa yo‘q.");
        return;
      }
      if (current.steps[mission.id] === undefined) {
        const started = { ...current, steps: { ...current.steps, [mission.id]: 0 } };
        progressRef.current = started;
        setProgress(started);
      }
      setReflection("");
      setDialogue({ missionId: mission.id });
      playTone(520);
      return;
    }
    const mission = missions.find((item) => {
      const step = progressRef.current.steps[item.id];
      return !progressRef.current.completed.includes(item.id) && step !== undefined && item.stages[step]?.targetId === target.id;
    });
    if (mission) {
      setReflection("");
      setDialogue({ missionId: mission.id });
      playTone(520);
    }
  }, [nearby, playTone, showToast]);

  const completeMission = useCallback((mission: Mission, text: string) => {
    const current = progressRef.current;
    if (current.completed.includes(mission.id)) return;
    const updated: Progress = {
      ...current,
      xp: current.xp + mission.xp,
      completed: [...current.completed, mission.id],
      reflections: { ...current.reflections, [mission.id]: text.trim() },
      inventory: [
        ...current.inventory,
        mission.reward,
        ...(current.completed.length === 0 ? ["Sarguzashtchi qalpog‘i"] : []),
      ],
      steps: { ...current.steps, [mission.id]: mission.stages.length - 1 },
    };
    progressRef.current = updated;
    setProgress(updated);
    setDialogue(null);
    setReflection("");
    showToast(`+${mission.xp} XP · ${mission.reward}`);
    playTone(740);
  }, [playTone, showToast]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const shell = canvasShellRef.current;
    if (!canvas || !shell || !loaded) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      showToast("Brauzer o‘yin sahnasini chiza olmadi.");
      return;
    }
    let frame = 0;
    let lastTime = 0;
    let lastNearbyId = "";
    let lastWallMessage = 0;
    let lastStored = 0;
    let cssWidth = 0;
    let cssHeight = 0;
    let zoom = 1;
    const held = heldKeysRef.current;
    const resizeObserver = new ResizeObserver(() => {
      const rect = shell.getBoundingClientRect();
      cssWidth = rect.width;
      cssHeight = rect.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(cssWidth * ratio));
      canvas.height = Math.max(1, Math.round(cssHeight * ratio));
      zoom = Math.min(cssWidth / 1120, cssHeight / 650, 1);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    });
    resizeObserver.observe(shell);

    const onKeyDown = (event: KeyboardEvent) => {
      if (isInputTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
      if (key === "escape" || key === "p") {
        if (!dialogueRef.current && !event.repeat) setPaused((value) => !value);
        return;
      }
      if ((key === "e" || event.code === "Space") && !event.repeat) {
        event.preventDefault();
        handleInteract();
        return;
      }
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) held.add(key);
    };
    const onKeyUp = (event: KeyboardEvent) => held.delete(event.key.toLowerCase());
    const onBlur = () => held.clear();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    const draw = (time: number) => {
      const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.045) : 0;
      lastTime = time;
      const player = playerRef.current;
      const gameProgress = progressRef.current;
      const currentlyUnlocked = keysRef.current.unlocked;
      const pausedNow = keysRef.current.paused || Boolean(dialogueRef.current);
      let dx = joystickRef.current.x;
      let dy = joystickRef.current.y;
      if (held.has("a") || held.has("arrowleft")) dx -= 1;
      if (held.has("d") || held.has("arrowright")) dx += 1;
      if (held.has("w") || held.has("arrowup")) dy -= 1;
      if (held.has("s") || held.has("arrowdown")) dy += 1;
      const magnitude = Math.hypot(dx, dy);
      if (!pausedNow && magnitude > 0.08) {
        dx /= Math.max(1, magnitude);
        dy /= Math.max(1, magnitude);
        player.direction = Math.atan2(dy, dx);
        const nextX = Math.min(WORLD_WIDTH - PLAYER_RADIUS, Math.max(PLAYER_RADIUS, player.x + dx * MOVE_SPEED * dt));
        const nextY = Math.min(WORLD_HEIGHT - PLAYER_RADIUS, Math.max(PLAYER_RADIUS, player.y + dy * MOVE_SPEED * dt));
        const candidateRegion = (x: number, y: number) => {
          const column = Math.min(2, Math.floor(x / 600));
          const row = y < 600 ? 0 : 1;
          return [["school", "friendship", "digital"], ["justice", "team", "future"]][row][column];
        };
        const regionX = candidateRegion(nextX, player.y);
        const regionY = candidateRegion(player.x, nextY);
        const blockedByRegion = !currentlyUnlocked.includes(regionX) || !currentlyUnlocked.includes(regionY);
        if (blockedByRegion) {
          if (time - lastWallMessage > 1800) {
            const locked = !currentlyUnlocked.includes(regionX) ? regionX : regionY;
            const requirements: Record<string, string> = {
              friendship: "“Guruh chatidagi mojaro” missiyasini yakunlang.",
              digital: "“Guruh chatidagi mojaro” missiyasini yakunlang.",
              justice: "“Do‘stimning kayfiyati” missiyasini yakunlang.",
              team: "“Soxta xabar” missiyasini yakunlang.",
              future: "Barcha beshta missiyani yakunlang.",
            };
            showToast(`Hudud hozircha yopiq. ${requirements[locked] || ""}`);
            lastWallMessage = time;
          }
        } else {
          const collides = (x: number, y: number) => obstacles.some((item) =>
            x + PLAYER_RADIUS > item.x && x - PLAYER_RADIUS < item.x + item.width &&
            y + PLAYER_RADIUS > item.y && y - PLAYER_RADIUS < item.y + item.height,
          );
          if (!collides(nextX, player.y)) player.x = nextX;
          if (!collides(player.x, nextY)) player.y = nextY;
        }
      }
      player.moving = !pausedNow && magnitude > 0.08;

      const scale = zoom || 1;
      ctx.setTransform(window.devicePixelRatio ? Math.min(window.devicePixelRatio, 2) : 1, 0, 0, Math.min(window.devicePixelRatio || 1, 2), 0, 0);
      ctx.clearRect(0, 0, cssWidth, cssHeight);
      ctx.save();
      ctx.translate(cssWidth / 2, cssHeight / 2);
      ctx.scale(scale, scale);
      ctx.translate(-player.x, -player.y);
      ctx.fillStyle = "#3d9565";
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      for (let y = 0; y < WORLD_HEIGHT; y += 52) {
        for (let x = 0; x < WORLD_WIDTH; x += 52) {
          const variant = ((x / 52 + y / 52) % 3) === 0;
          ctx.fillStyle = variant ? "rgba(211,255,206,.055)" : "rgba(10,70,47,.035)";
          ctx.fillRect(x, y, 51, 51);
        }
      }
      const zoneData = [
        { id: "school", x: 0, y: 0, color: "rgba(66, 153, 225, .12)", label: "MAKTAB HOVLISI", tint: "#dff5ff" },
        { id: "friendship", x: 600, y: 0, color: "rgba(52, 211, 153, .13)", label: "DO‘STLIK OROLI", tint: "#dcfff1" },
        { id: "digital", x: 1200, y: 0, color: "rgba(96, 165, 250, .14)", label: "RAQAMLI SHAHAR", tint: "#e0edff" },
        { id: "justice", x: 0, y: 600, color: "rgba(251, 191, 36, .13)", label: "ADOLAT MAYDONI", tint: "#fff3cb" },
        { id: "team", x: 600, y: 600, color: "rgba(167, 139, 250, .14)", label: "JAMOA MARKAZI", tint: "#efe5ff" },
        { id: "future", x: 1200, y: 600, color: "rgba(244, 114, 182, .13)", label: "KELAJAK LABORATORIYASI", tint: "#ffe3f1" },
      ];
      for (const zone of zoneData) {
        ctx.fillStyle = zone.color;
        ctx.fillRect(zone.x, zone.y, 600, 600);
        ctx.strokeStyle = "rgba(255,255,255,.12)";
        ctx.setLineDash([9, 12]);
        ctx.lineWidth = 2;
        ctx.strokeRect(zone.x + 8, zone.y + 8, 584, 584);
        ctx.setLineDash([]);
        ctx.font = "900 13px system-ui";
        ctx.textAlign = "left";
        ctx.fillStyle = zone.tint;
        ctx.fillText(zone.label, zone.x + 25, zone.y + 33);
        if (!currentlyUnlocked.includes(zone.id)) {
          ctx.fillStyle = "rgba(15, 23, 42, .24)";
          ctx.fillRect(zone.x, zone.y, 600, 600);
          ctx.fillStyle = "rgba(15, 23, 42, .78)";
          roundedRect(ctx, zone.x + 208, zone.y + 268, 184, 66, 16);
          ctx.fill();
          ctx.font = "800 14px system-ui";
          ctx.textAlign = "center";
          ctx.fillStyle = "#fff";
          ctx.fillText("🔒  MISSIYA BILAN OCHILADI", zone.x + 300, zone.y + 306);
        }
      }

      ctx.fillStyle = "#c4b68b";
      ctx.fillRect(0, 555, WORLD_WIDTH, 90);
      ctx.fillRect(855, 0, 90, WORLD_HEIGHT);
      ctx.fillStyle = "rgba(255,255,255,.18)";
      for (let x = 25; x < WORLD_WIDTH; x += 70) ctx.fillRect(x, 598, 38, 4);
      for (let y = 25; y < WORLD_HEIGHT; y += 70) ctx.fillRect(898, y, 4, 38);
      ctx.fillStyle = "rgba(250, 246, 216, .8)";
      ctx.beginPath();
      ctx.arc(900, 600, 55, 0, Math.PI * 2);
      ctx.fill();

      for (const [x, y, s] of [
        [500, 105, .85], [485, 320, .8], [525, 520, .7], [630, 255, .9],
        [1065, 100, .9], [1150, 520, .8], [1215, 135, .8], [1685, 350, 1],
        [520, 740, .85], [540, 1080, 1], [645, 1055, .8], [1080, 1080, .9],
        [1230, 1030, .8], [1665, 1000, .9], [1720, 520, .8], [690, 520, .7],
      ]) drawTree(ctx, x, y, s);

      for (const obstacle of obstacles) drawBuilding(ctx, obstacle, obstacles.indexOf(obstacle));
      for (const [x, y] of [[460, 370], [710, 460], [1110, 495], [395, 1020], [1120, 735], [1475, 590]]) {
        ctx.fillStyle = "#79573f";
        roundedRect(ctx, x, y, 58, 13, 5);
        ctx.fill();
        ctx.fillStyle = "#d6a276";
        ctx.fillRect(x + 6, y + 3, 4, 22);
        ctx.fillRect(x + 48, y + 3, 4, 22);
      }
      for (const target of targets) {
        if (target.kind === "npc") {
          const mission = target.missionId ? missionById.get(target.missionId) : undefined;
          drawNpc(
            ctx,
            target,
            time,
            getTargetAvailability(target, gameProgress),
            Boolean(mission && gameProgress.completed.includes(mission.id)),
          );
        } else drawTargetObject(ctx, target);
      }

      if (player.moving) {
        for (let i = 0; i < 3; i += 1) {
          ctx.fillStyle = `rgba(255,255,255,${.17 - i * .045})`;
          ctx.beginPath();
          ctx.arc(player.x - Math.cos(player.direction) * (24 + i * 12), player.y + 9 - Math.sin(player.direction) * (24 + i * 12), 4 - i * .7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      const bob = player.moving ? Math.sin(time / 75) * 3 : Math.sin(time / 500) * 1;
      ctx.fillStyle = "rgba(12, 24, 37, .28)";
      ctx.beginPath();
      ctx.ellipse(player.x, player.y + 15, 18, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(player.x, player.y + bob);
      ctx.rotate(player.direction);
      ctx.fillStyle = "#7c3aed";
      roundedRect(ctx, -12, -3, 25, 27, 9);
      ctx.fill();
      ctx.fillStyle = "#f2c5a5";
      ctx.beginPath();
      ctx.arc(0, -13, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#34234e";
      ctx.beginPath();
      ctx.arc(-1, -17, 10, Math.PI, Math.PI * 2);
      ctx.fill();
      if (gameProgress.inventory.includes("Sarguzashtchi qalpog‘i")) {
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.ellipse(0, -26, 12, 5, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-8, -28, 16, 5);
        ctx.fillRect(-14, -23, 28, 3);
      }
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.arc(7, -13, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.font = "800 10px system-ui";
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.fillText("AISHA · 1-DARAJA", player.x, player.y + 39);
      ctx.restore();

      const possible = targets
      .filter((target) => getTargetAvailability(target, gameProgress))
        .map((target) => ({ target, distance: Math.hypot(target.x - player.x, target.y - player.y) }))
        .filter(({ distance }) => distance <= 86)
        .sort((a, b) => a.distance - b.distance)[0]?.target ?? null;
      const possibleId = possible?.id || "";
      if (possibleId !== lastNearbyId) {
        lastNearbyId = possibleId;
        setNearby(possible);
      }
      if (time - lastStored > 1200 && !pausedNow) {
        lastStored = time;
        const position = { x: player.x, y: player.y };
        const latest = progressRef.current;
        if (Math.abs(latest.position.x - position.x) > 3 || Math.abs(latest.position.y - position.y) > 3) {
          const updated = { ...latest, position };
          progressRef.current = updated;
          setProgress(updated);
        }
      }
      frame = window.requestAnimationFrame(draw);
    };
    frame = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      held.clear();
    };
  }, [getTargetAvailability, handleInteract, loaded, showToast]);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error("Hayot simulyatori progressini saqlab bo‘lmadi:", error);
      showToast("Progressni brauzerda saqlab bo‘lmadi. Brauzer xotirasini tekshiring.");
    }
  }, [loaded, progress, showToast]);


  const chooseOption = (choice: MissionChoice) => {
    setDialogue((current) => current ? { ...current, choice } : current);
    playTone(440);
  };

  const continueMission = () => {
    if (!dialogue) return;
    const mission = missionById.get(dialogue.missionId);
    if (!mission) return;
    if (dialogue.reflection) {
      completeMission(mission, reflection);
      return;
    }
    const step = progressRef.current.steps[mission.id] ?? 0;
    if (step >= mission.stages.length - 1) {
      setDialogue({ missionId: mission.id, reflection: true });
      return;
    }
    const updated: Progress = {
      ...progressRef.current,
      steps: { ...progressRef.current.steps, [mission.id]: step + 1 },
    };
    progressRef.current = updated;
    setProgress(updated);
    setDialogue(null);
    const target = targets.find((item) => item.id === mission.stages[step + 1]?.targetId);
    if (target) showToast(`Keyingi qadam: ${target.name} bilan gaplashing.`);
  };

  const onStickPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    joystickRef.current.pointerId = event.pointerId;
    updateStick(event);
  };
  const updateStick = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const radius = rect.width / 2;
    const offsetX = event.clientX - (rect.left + radius);
    const offsetY = event.clientY - (rect.top + radius);
    const length = Math.hypot(offsetX, offsetY);
    const scale = length > radius * .68 ? radius * .68 / length : 1;
    const x = offsetX * scale;
    const y = offsetY * scale;
    setStickPosition({ x, y });
    joystickRef.current.x = x / (radius * .68);
    joystickRef.current.y = y / (radius * .68);
  };
  const onStickPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (joystickRef.current.pointerId !== event.pointerId) return;
    event.preventDefault();
    updateStick(event);
  };
  const onStickPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (joystickRef.current.pointerId !== event.pointerId) return;
    joystickRef.current = { x: 0, y: 0, pointerId: -1 };
    setStickPosition({ x: 0, y: 0 });
  };

  const currentMission = dialogue ? missionById.get(dialogue.missionId) : undefined;
  const currentStage = currentMission ? currentMission.stages[progress.steps[currentMission.id] ?? 0] : undefined;
  const currentLevel = Math.floor(progress.xp / 200) + 1;
  const objectiveMission = missions.find((mission) => !progress.completed.includes(mission.id));
  const objectiveStage = objectiveMission ? objectiveMission.stages[progress.steps[objectiveMission.id] ?? 0] : undefined;
  const objectiveTarget = objectiveStage ? targets.find((target) => target.id === objectiveStage.targetId) : undefined;

  return (
    <div className="container life-game-page">
      <section className="life-game-shell" aria-label="Hayot simulyatori o‘yin maydoni">
        <header className="life-game-hud">
          <div className="life-game-brand">
            <span className="life-game-logo">Z</span>
            <span><strong>Aisha</strong><small>{currentLevel}-daraja · {progress.xp} XP</small></span>
          </div>
          <div className="life-game-objective">
            <span>JORIY MAQSAD</span>
            <strong>{objectiveMission ? `${objectiveMission.title} · ${objectiveTarget?.name || "missiya"}` : "Barcha missiyalar bajarildi!"}</strong>
          </div>
          <div className="life-game-actions">
            <button type="button" className="life-game-icon-button" aria-label="Inventar" onClick={() => setShowInventory(true)}>🎒 <span>{progress.inventory.length}</span></button>
            <button type="button" className="life-game-icon-button" aria-label={muted ? "Ovozni yoqish" : "Ovozni o‘chirish"} onClick={() => setMuted((value) => !value)}>{muted ? "🔇" : "🔊"}</button>
            <button type="button" className="life-game-icon-button" aria-label={paused ? "Davom etish" : "Pauza"} onClick={() => setPaused((value) => !value)}>{paused ? "▶" : "Ⅱ"}</button>
          </div>
        </header>

        <div className="life-game-stage" ref={canvasShellRef}>
          <canvas ref={canvasRef} className="life-game-canvas" aria-label="Top-down interaktiv maktab shaharchasi" />
          <div className="life-game-map-key"><span>●</span> Ochiq hududlar <i>●</i> Missiya hududi <b>🔒</b> Yopiq</div>
          {!loaded && <div className="life-game-loading">Sarguzasht yuklanmoqda…</div>}
          {nearby && !dialogue && !paused && (
            <div className="life-game-nearby">
              <span className="life-game-keycap">E</span>
              <span><strong>{nearby.name}</strong><small>{nearby.kind === "object" ? "Tekshirish" : "Suhbatlashish"}</small></span>
              <button type="button" onClick={handleInteract}>Aloqa</button>
            </div>
          )}
          {toast && <div role="status" className="life-game-toast">{toast}</div>}
          {paused && !dialogue && (
            <div className="life-game-overlay">
              <div className="life-game-dialog life-game-pause">
                <span className="life-game-kicker">PAUZA</span>
                <h2>Sarguzashtni to‘xtatdingiz</h2>
                <p>Progress avtomatik ravishda shu brauzerda saqlanadi.</p>
                <button type="button" className="life-game-primary" onClick={() => setPaused(false)}>O‘yinga qaytish</button>
              </div>
            </div>
          )}
          {dialogue && currentMission && currentStage && (
            <div className="life-game-overlay">
              <section className="life-game-dialog" role="dialog" aria-modal="true" aria-labelledby="life-dialog-title">
                <div className="life-game-dialog-top">
                  <span className="life-game-kicker">{dialogue.reflection ? "MISSIYA YAKUNI" : currentMission.title}</span>
                  <button type="button" className="life-game-close" aria-label="Dialogni yopish" onClick={() => setDialogue(null)}>×</button>
                </div>
                {dialogue.reflection ? (
                  <>
                    <h2 id="life-dialog-title">Bu vaziyatdan nimani olib qoldingiz?</h2>
                    <p>Javob ixtiyoriy. Bu yerda togri yoki notogri deb baholanmaysiz; fikringizni qayd etishingiz mumkin.</p>
                    <label className="life-game-reflection-label" htmlFor="mission-reflection">Qisqa fikringiz (ixtiyoriy)</label>
                    <textarea id="mission-reflection" className="life-game-reflection" maxLength={240} value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="Qaysi qaroringiz boshqalarga qanday ta’sir qildi?" />
                    <div className="life-game-reward-preview"><span>🏅</span><div><strong>{currentMission.reward}</strong><small>+{currentMission.xp} XP · {currentLevel + (progress.xp % 200 + currentMission.xp >= 200 ? 1 : 0)}-daraja sari</small></div></div>
                    <button type="button" className="life-game-primary" onClick={continueMission}>Mukofotni olish</button>
                  </>
                ) : dialogue.choice ? (
                  <>
                    <div className="life-game-speaker">{currentStage.speaker}</div>
                    <h2 id="life-dialog-title">Qaroringizning ta’siri</h2>
                    <div className="life-game-outcome"><span>↗</span><p>{dialogue.choice.outcome}</p></div>
                    <div className="life-game-step-count">QADAM {(progress.steps[currentMission.id] ?? 0) + 1} / {currentMission.stages.length}</div>
                    <button type="button" className="life-game-primary" onClick={continueMission}>{(progress.steps[currentMission.id] ?? 0) === currentMission.stages.length - 1 ? "Yakuniy fikrga o‘tish" : "Keyingi qadam"}</button>
                  </>
                ) : (
                  <>
                    <div className="life-game-speaker">{currentStage.speaker}</div>
                    <h2 id="life-dialog-title">{currentStage.prompt}</h2>
                    <div className="life-game-choices">
                      {currentStage.choices.map((choice, index) => (
                        <button type="button" key={choice.label} onClick={() => chooseOption(choice)}>
                          <span>{String.fromCharCode(65 + index)}</span>{choice.label}
                        </button>
                      ))}
                    </div>
                    <div className="life-game-dialog-foot">Qadam {(progress.steps[currentMission.id] ?? 0) + 1} / {currentMission.stages.length} <span>Har tanlov boshqa oqibatga olib keladi.</span></div>
                  </>
                )}
              </section>
            </div>
          )}
          {showInventory && (
            <div className="life-game-overlay">
              <section className="life-game-dialog" role="dialog" aria-modal="true" aria-labelledby="inventory-title">
                <div className="life-game-dialog-top"><span className="life-game-kicker">TO‘PLANGAN NISHONLAR</span><button type="button" className="life-game-close" aria-label="Inventarni yopish" onClick={() => setShowInventory(false)}>×</button></div>
                <h2 id="inventory-title">Sarguzasht inventari</h2>
                <div className="life-game-inventory">
                  {progress.inventory.length ? progress.inventory.map((item) => <div key={item}>🏅 <span>{item}</span></div>) : <p>Missiyani tugatib, birinchi nishoningizni oling.</p>}
                </div>
                <p className="life-game-storage-note">O‘yin natijalari faqat shu brauzer qurilmasida saqlanadi.</p>
                <button type="button" className="life-game-primary" onClick={() => setShowInventory(false)}>Davom etish</button>
              </section>
            </div>
          )}

          <div className="life-game-mobile-controls">
            <div
              className="life-game-joystick"
              role="application"
              aria-label="Harakat uchun virtual joystick"
              onPointerDown={onStickPointerDown}
              onPointerMove={onStickPointerMove}
              onPointerUp={onStickPointerUp}
              onPointerCancel={onStickPointerUp}
            >
              <span className="life-game-joystick-center" style={{ transform: `translate(${stickPosition.x}px, ${stickPosition.y}px)` }} />
              <span className="life-game-joystick-up">⌃</span>
              <span className="life-game-joystick-side left">‹</span>
              <span className="life-game-joystick-side right">›</span>
              <span className="life-game-joystick-down">⌄</span>
            </div>
            <button type="button" className="life-game-touch-action" onClick={handleInteract}>E<br /><small>Aloqa</small></button>
          </div>
        </div>

        <footer className="life-game-footer">
          <span>⌨ WASD / ← ↑ → ↓ · E yoki Space — aloqa · P — pauza</span>
          <span>{progress.completed.length}/{missions.length} missiya · {unlocked.length}/6 hudud ochiq</span>
        </footer>
      </section>
      <p className="life-game-privacy">O‘yin ichidagi XP — bajarilgan faoliyat uchun tajriba, insonning haqiqiy fazilatlari bahosi emas.</p>
    </div>
  );
}
