"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  NPC_DATA,
  NPC_LIST,
  MASTER_ACHIEVEMENT,
  type NpcDefinition,
  type NpcId,
} from "./npcData";
import {
  GridPathfinder,
  findStandSpotNearNpc,
  PLAYER_RADIUS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  type Point,
  type Rect,
} from "./pathfinding";

type NpcState = {
  stage: number;
  completed: boolean;
  answers: number[];
  reflection: string;
};

type Progress = {
  version: 3;
  xp: number;
  inventory: string[];
  npcs: Record<NpcId, NpcState>;
  master: boolean;
  position: Point;
};

type DialoguePhase = "intro" | "question" | "response" | "reflection";

type DialogueState = {
  npcId: NpcId;
  phase: DialoguePhase;
  stageIndex: number;
  chosen?: number;
  replay: boolean;
};

type AutoWalk = {
  npcId: NpcId;
  waypoints: Point[];
};

type NearbyInfo = {
  npc: NpcDefinition;
  state: NpcState;
};

const SAVE_KEY = "z-avlod-hayot-simulator-v3";
const LEGACY_SAVE_KEY = "z-avlod-hayot-simulator-v2";
const MOVE_SPEED = 210;
const TALK_DISTANCE = 52;

const obstacles: Rect[] = [
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

const zoneData = [
  { id: "school", x: 0, y: 0, color: "rgba(66, 153, 225, .12)", label: "MAKTAB HOVLISI", tint: "#dff5ff" },
  { id: "friendship", x: 600, y: 0, color: "rgba(52, 211, 153, .13)", label: "DO‘STLIK OROLI", tint: "#dcfff1" },
  { id: "digital", x: 1200, y: 0, color: "rgba(96, 165, 250, .14)", label: "RAQAMLI SHAHAR", tint: "#e0edff" },
  { id: "justice", x: 0, y: 600, color: "rgba(251, 191, 36, .13)", label: "ADOLAT MAYDONI", tint: "#fff3cb" },
  { id: "team", x: 600, y: 600, color: "rgba(167, 139, 250, .14)", label: "JAMOA MARKAZI", tint: "#efe5ff" },
  { id: "future", x: 1200, y: 600, color: "rgba(244, 114, 182, .13)", label: "KELAJAK LABORATORIYASI", tint: "#ffe3f1" },
];

const legacyMissionToNpc: Record<string, NpcId> = {
  "guruh-chat": "diyor",
  "dost-kayfiyati": "kamol",
  "imtihon-siri": "malika",
  "jamoa-xavf": "jasur",
};

function createNpcState(): NpcState {
  return { stage: 0, completed: false, answers: [], reflection: "" };
}

function createProgress(): Progress {
  return {
    version: 3,
    xp: 0,
    inventory: [],
    npcs: {
      diyor: createNpcState(),
      kamol: createNpcState(),
      malika: createNpcState(),
      jasur: createNpcState(),
      madina: createNpcState(),
    },
    master: false,
    position: { x: 500, y: 515 },
  };
}

function sanitizeNpcState(value: unknown): NpcState {
  const fallback = createNpcState();
  if (!value || typeof value !== "object") return fallback;
  const data = value as Partial<NpcState>;
  const stage =
    typeof data.stage === "number" && Number.isFinite(data.stage)
      ? Math.max(0, Math.min(5, Math.floor(data.stage)))
      : 0;
  const answers = Array.isArray(data.answers)
    ? data.answers.filter((item): item is number => typeof item === "number" && Number.isInteger(item) && item >= 0)
    : [];
  return {
    stage,
    completed: data.completed === true,
    answers,
    reflection: typeof data.reflection === "string" ? data.reflection.slice(0, 500) : "",
  };
}

function parseProgress(value: string): Progress {
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== "object") throw new Error("Saqlangan o‘yin ma’lumoti noto‘g‘ri.");
  const base = createProgress();

  const x = Number((parsed as Partial<Progress>).position?.x);
  const y = Number((parsed as Partial<Progress>).position?.y);
  const position = {
    x: Number.isFinite(x) ? Math.min(WORLD_WIDTH - 30, Math.max(30, x)) : base.position.x,
    y: Number.isFinite(y) ? Math.min(WORLD_HEIGHT - 30, Math.max(30, y)) : base.position.y,
  };

  const rawXp = (parsed as Partial<Progress>).xp;
  const rawInventory = (parsed as Partial<Progress>).inventory;
  const xp = typeof rawXp === "number" && Number.isFinite(rawXp) && rawXp >= 0 ? rawXp : 0;
  const inventory = Array.isArray(rawInventory)
    ? rawInventory.filter((item): item is string => typeof item === "string")
    : [];

  const data = parsed as { version?: number; npcs?: unknown };
  const npcs = { ...base.npcs };

  if (data.version === 3 && data.npcs && typeof data.npcs === "object") {
    for (const npc of NPC_LIST) {
      npcs[npc.id] = sanitizeNpcState((data.npcs as Record<string, unknown>)[npc.id]);
    }
  } else {
    // Migrate from the legacy mission-based schema (v1/v2) without losing progress.
    const legacy = parsed as {
      completed?: unknown;
      reflections?: Record<string, string>;
    };
    const completedIds = Array.isArray(legacy.completed)
      ? legacy.completed.filter((id): id is string => typeof id === "string")
      : [];
    for (const legacyId of completedIds) {
      const npcId = legacyMissionToNpc[legacyId];
      if (!npcId) continue;
      npcs[npcId] = {
        stage: 5,
        completed: true,
        answers: [],
        reflection: legacy.reflections?.[legacyId] ?? "",
      };
    }
  }

  const completedCount = NPC_LIST.filter((npc) => npcs[npc.id].completed).length;
  const master = Boolean((parsed as Partial<Progress>).master) || completedCount === NPC_LIST.length;

  return { version: 3, xp, inventory, npcs, master, position };
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

function drawBuilding(ctx: CanvasRenderingContext2D, obstacle: Rect, index: number) {
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

function drawNpcMarker(ctx: CanvasRenderingContext2D, npc: NpcDefinition, state: NpcState, time: number) {
  const bob = Math.sin(time / 240 + npc.x) * 1.8;
  const y = npc.y + bob;
  const mx = npc.x + 18;
  const my = y - 30;

  if (state.completed) {
    ctx.fillStyle = "#34d399";
    ctx.beginPath();
    ctx.arc(mx, my, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#064e3b";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(mx - 5, my);
    ctx.lineTo(mx - 1.5, my + 4);
    ctx.lineTo(mx + 5, my - 4.5);
    ctx.stroke();
    return;
  }

  if (state.stage > 0) {
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(mx, my, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "900 10px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = "#10201d";
    ctx.fillText(`${state.stage}/5`, mx, my + 3.5);
    return;
  }

  ctx.fillStyle = "#38bdf8";
  roundedRect(ctx, mx - 12, my - 10, 24, 19, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(mx - 4, my + 9);
  ctx.lineTo(mx + 2, my + 9);
  ctx.lineTo(mx - 1, my + 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#0b1e33";
  for (const dot of [-5, 0, 5]) {
    ctx.beginPath();
    ctx.arc(mx + dot, my - 0.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawNpc(ctx: CanvasRenderingContext2D, npc: NpcDefinition, time: number, selected: boolean, state: NpcState) {
  const bob = Math.sin(time / 240 + npc.x) * 1.8;
  const y = npc.y + bob;

  if (selected) {
    ctx.strokeStyle = "rgba(251, 191, 36, .95)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(npc.x, npc.y + 14, 23, 11, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.moveTo(npc.x, y - 36);
    ctx.lineTo(npc.x - 8, y - 48);
    ctx.lineTo(npc.x + 8, y - 48);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = "rgba(11, 22, 34, .24)";
  ctx.beginPath();
  ctx.ellipse(npc.x, npc.y + 14, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = npc.color || "#60a5fa";
  roundedRect(ctx, npc.x - 13, y - 1, 26, 29, 10);
  ctx.fill();
  ctx.fillStyle = "#f2c5a5";
  ctx.beginPath();
  ctx.arc(npc.x, y - 12, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#23324b";
  ctx.beginPath();
  ctx.arc(npc.x, y - 16, 10, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#172033";
  ctx.beginPath();
  ctx.arc(npc.x - 3, y - 12, 1, 0, Math.PI * 2);
  ctx.arc(npc.x + 3, y - 12, 1, 0, Math.PI * 2);
  ctx.fill();

  drawNpcMarker(ctx, npc, state, time);

  ctx.font = "700 11px system-ui";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(15, 23, 42, .82)";
  roundedRect(ctx, npc.x - 68, npc.y + 33, 136, 22, 9);
  ctx.fill();
  ctx.fillStyle = "#f8fafc";
  ctx.fillText(npc.name, npc.x, npc.y + 48);
}

function isInputTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("input, textarea, select, button, [contenteditable=true]"));
}

export default function HayotGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasShellRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef({ x: 500, y: 515, direction: 0, moving: false });
  const heldKeysRef = useRef(new Set<string>());
  const joystickRef = useRef({ x: 0, y: 0, pointerId: -1 });
  const progressRef = useRef(createProgress());
  const dialogueRef = useRef<DialogueState | null>(null);
  const pausedRef = useRef(false);
  const selectedNpcRef = useRef<NpcId | null>(null);
  const nearbyNpcRef = useRef<NpcDefinition | null>(null);
  const autoPathRef = useRef<AutoWalk | null>(null);
  const pathfinderRef = useRef<GridPathfinder | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionsRef = useRef<{
    openDialogue: (npcId: NpcId) => void;
    startAutoWalk: (npc: NpcDefinition) => void;
  }>({ openDialogue: () => {}, startAutoWalk: () => {} });

  const [progress, setProgress] = useState<Progress>(createProgress);
  const [loaded, setLoaded] = useState(false);
  const [dialogue, setDialogue] = useState<DialogueState | null>(null);
  const [selectedNpcId, setSelectedNpcId] = useState<NpcId | null>(null);
  const [nearby, setNearby] = useState<NearbyInfo | null>(null);
  const [toast, setToast] = useState("");
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [stickPosition, setStickPosition] = useState({ x: 0, y: 0 });
  const [reflection, setReflection] = useState("");
  const [showInventory, setShowInventory] = useState(false);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 3400);
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
      const saved = window.localStorage.getItem(SAVE_KEY) ?? window.localStorage.getItem(LEGACY_SAVE_KEY);
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

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    selectedNpcRef.current = selectedNpcId;
  }, [selectedNpcId]);

  const openDialogue = useCallback((npcId: NpcId) => {
    if (dialogueRef.current || pausedRef.current) return;
    const npc = NPC_DATA[npcId];
    if (!npc) return;
    const state = progressRef.current.npcs[npcId];
    setReflection(state.reflection ?? "");
    setSelectedNpcId(npcId);
    setDialogue({
      npcId,
      phase: "intro",
      stageIndex: state.completed ? 0 : Math.min(state.stage, npc.stages.length - 1),
      replay: state.completed,
    });
    playTone(520);
  }, [playTone]);

  const startAutoWalk = useCallback((npc: NpcDefinition) => {
    const player = playerRef.current;
    const distance = Math.hypot(npc.x - player.x, npc.y - player.y);
    if (distance <= TALK_DISTANCE + 8) {
      openDialogue(npc.id);
      return;
    }
    if (!pathfinderRef.current) pathfinderRef.current = new GridPathfinder(obstacles);
    const spot = findStandSpotNearNpc(player, npc, obstacles, TALK_DISTANCE);
    const path = pathfinderRef.current.findPath(player, spot);
    if (!path || path.length === 0) {
      autoPathRef.current = null;
      setSelectedNpcId(null);
      showToast("Yo‘l topilmadi. Boshqa tomondan yaqinroq boring.");
      return;
    }
    autoPathRef.current = { npcId: npc.id, waypoints: path };
    setSelectedNpcId(npc.id);
  }, [openDialogue, showToast]);

  useEffect(() => {
    actionsRef.current = { openDialogue, startAutoWalk };
  }, [openDialogue, startAutoWalk]);

  const chooseOption = useCallback((index: number) => {
    setDialogue((current) => {
      if (!current || current.phase !== "question") return current;
      return { ...current, phase: "response", chosen: index };
    });
    playTone(440);
  }, [playTone]);

  const advanceResponse = useCallback(() => {
    const current = dialogueRef.current;
    if (!current || current.phase !== "response" || current.chosen === undefined) return;
    const npc = NPC_DATA[current.npcId];
    const stage = current.stageIndex;
    const isLastStage = stage >= npc.stages.length - 1;

    if (!current.replay) {
      const previous = progressRef.current.npcs[current.npcId];
      const answers = [...previous.answers];
      answers[stage] = current.chosen;
      const updatedState: NpcState = {
        ...previous,
        answers,
        stage: Math.max(previous.stage, stage + 1),
      };
      const updated: Progress = {
        ...progressRef.current,
        npcs: { ...progressRef.current.npcs, [current.npcId]: updatedState },
      };
      progressRef.current = updated;
      setProgress(updated);
    }

    if (isLastStage) {
      setDialogue({ ...current, phase: "reflection" });
    } else {
      setDialogue({ ...current, phase: "question", stageIndex: stage + 1, chosen: undefined });
    }
    playTone(440);
  }, [playTone]);

  const finishConversation = useCallback(() => {
    const current = dialogueRef.current;
    if (!current) return;
    const npc = NPC_DATA[current.npcId];
    const previous = progressRef.current.npcs[current.npcId];
    const reflectionText = reflection.trim().slice(0, 400);

    if (!previous.completed) {
      const isFirstCompletionAny = !progressRef.current.inventory.includes(npc.rewardBadge);
      const updatedNpcs: Record<NpcId, NpcState> = {
        ...progressRef.current.npcs,
        [current.npcId]: { ...previous, stage: npc.stages.length, completed: true, reflection: reflectionText },
      };
      let xpGain = npc.rewardXp;
      let inventory = [...progressRef.current.inventory];
      if (isFirstCompletionAny) inventory = [...inventory, npc.rewardBadge];

      const allDone = NPC_LIST.every((item) => updatedNpcs[item.id].completed);
      let masterJustEarned = false;
      if (allDone && !progressRef.current.master) {
        masterJustEarned = true;
        xpGain += MASTER_ACHIEVEMENT.xpBonus;
        if (!inventory.includes(MASTER_ACHIEVEMENT.badge)) inventory = [...inventory, MASTER_ACHIEVEMENT.badge];
      }

      const updated: Progress = {
        ...progressRef.current,
        xp: progressRef.current.xp + xpGain,
        inventory,
        npcs: updatedNpcs,
        master: progressRef.current.master || allDone,
      };
      progressRef.current = updated;
      setProgress(updated);
      setDialogue(null);
      setReflection("");
      autoPathRef.current = null;
      showToast(
        masterJustEarned
          ? `🏆 ${MASTER_ACHIEVEMENT.title}! +${xpGain} XP`
          : `+${npc.rewardXp} XP · ${npc.rewardBadge}`,
      );
      playTone(740);
    } else {
      const updated: Progress = {
        ...progressRef.current,
        npcs: {
          ...progressRef.current.npcs,
          [current.npcId]: { ...previous, reflection: reflectionText },
        },
      };
      progressRef.current = updated;
      setProgress(updated);
      setDialogue(null);
      setReflection("");
      autoPathRef.current = null;
      showToast("Suhbat qayta ko‘rildi. Takroriy XP berilmaydi.");
      playTone(620);
    }
  }, [playTone, reflection, showToast]);

  const closeDialogue = useCallback(() => {
    setDialogue(null);
    setReflection("");
  }, []);

  const handleInteract = useCallback(() => {
    if (dialogueRef.current || pausedRef.current) return;
    const info = nearby;
    if (!info) return;
    startAutoWalk(info.npc);
  }, [nearby, startAutoWalk]);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error("Hayot simulyatori progressini saqlab bo‘lmadi:", error);
      showToast("Progressni brauzerda saqlab bo‘lmadi. Brauzer xotirasini tekshiring.");
    }
  }, [loaded, progress, showToast]);

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
    let lastStored = 0;
    let staleTime = 0;
    let announced = false;
    let cssWidth = 0;
    let cssHeight = 0;
    let zoom = 1;
    const held = heldKeysRef.current;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);

    const resizeObserver = new ResizeObserver(() => {
      const rect = shell.getBoundingClientRect();
      cssWidth = rect.width;
      cssHeight = rect.height;
      canvas.width = Math.max(1, Math.round(cssWidth * ratio));
      canvas.height = Math.max(1, Math.round(cssHeight * ratio));
      zoom = Math.min(cssWidth / 1120, cssHeight / 650, 1);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    });
    resizeObserver.observe(shell);

    const collides = (x: number, y: number) =>
      obstacles.some(
        (item) =>
          x + PLAYER_RADIUS > item.x &&
          x - PLAYER_RADIUS < item.x + item.width &&
          y + PLAYER_RADIUS > item.y &&
          y - PLAYER_RADIUS < item.y + item.height,
      );

    const onKeyDown = (event: KeyboardEvent) => {
      if (isInputTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
      if (key === "escape") {
        if (dialogueRef.current) {
          setDialogue(null);
          setReflection("");
        } else if (!event.repeat) {
          setPaused((value) => !value);
        }
        return;
      }
      if (key === "p") {
        if (!dialogueRef.current && !event.repeat) setPaused((value) => !value);
        return;
      }
      if ((key === "e" || event.code === "Space") && !event.repeat) {
        event.preventDefault();
        const npc = nearbyNpcRef.current;
        if (npc) actionsRef.current.startAutoWalk(npc);
        return;
      }
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) held.add(key);
    };
    const onKeyUp = (event: KeyboardEvent) => held.delete(event.key.toLowerCase());
    const onBlur = () => held.clear();

    const onCanvasPointerDown = (event: PointerEvent) => {
      if (pausedRef.current || dialogueRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const sx = event.clientX - rect.left;
      const sy = event.clientY - rect.top;
      const scale = zoom || 1;
      const player = playerRef.current;
      const worldX = player.x + (sx - cssWidth / 2) / scale;
      const worldY = player.y + (sy - cssHeight / 2) / scale;
      let hit: NpcDefinition | null = null;
      for (const npc of NPC_LIST) {
        if (worldX >= npc.x - 26 && worldX <= npc.x + 26 && worldY >= npc.y - 34 && worldY <= npc.y + 42) {
          hit = npc;
          break;
        }
      }
      if (!hit) return;
      event.preventDefault();
      actionsRef.current.startAutoWalk(hit);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    canvas.addEventListener("pointerdown", onCanvasPointerDown);

    const draw = (time: number) => {
      const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.045) : 0;
      lastTime = time;
      const player = playerRef.current;
      const gameProgress = progressRef.current;
      const pausedNow = pausedRef.current || Boolean(dialogueRef.current);

      let dx = joystickRef.current.x;
      let dy = joystickRef.current.y;
      if (held.has("a") || held.has("arrowleft")) dx -= 1;
      if (held.has("d") || held.has("arrowright")) dx += 1;
      if (held.has("w") || held.has("arrowup")) dy -= 1;
      if (held.has("s") || held.has("arrowdown")) dy += 1;
      const magnitude = Math.hypot(dx, dy);

      let moving = false;

      if (!pausedNow && magnitude > 0.08) {
        if (autoPathRef.current) {
          autoPathRef.current = null;
          setSelectedNpcId(null);
        }
        dx /= Math.max(1, magnitude);
        dy /= Math.max(1, magnitude);
        player.direction = Math.atan2(dy, dx);
        const nextX = Math.min(WORLD_WIDTH - PLAYER_RADIUS, Math.max(PLAYER_RADIUS, player.x + dx * MOVE_SPEED * dt));
        const nextY = Math.min(WORLD_HEIGHT - PLAYER_RADIUS, Math.max(PLAYER_RADIUS, player.y + dy * MOVE_SPEED * dt));
        if (!collides(nextX, player.y)) player.x = nextX;
        if (!collides(player.x, nextY)) player.y = nextY;
        moving = true;
      } else if (!pausedNow && !dialogueRef.current && autoPathRef.current) {
        const auto = autoPathRef.current;
        const waypoint = auto.waypoints[0];
        const beforeX = player.x;
        const beforeY = player.y;
        const toX = waypoint.x - player.x;
        const toY = waypoint.y - player.y;
        const distance = Math.hypot(toX, toY);
        if (distance <= 6) {
          auto.waypoints.shift();
        } else {
          const step = Math.min(MOVE_SPEED * dt, distance);
          const moveX = (toX / distance) * step;
          const moveY = (toY / distance) * step;
          if (!collides(player.x + moveX, player.y)) player.x += moveX;
          if (!collides(player.x, player.y + moveY)) player.y += moveY;
          player.direction = Math.atan2(toY, toX);
          moving = true;
        }

        const npc = NPC_DATA[auto.npcId];
        const movedDistance = Math.hypot(player.x - beforeX, player.y - beforeY);
        if (auto.waypoints.length === 0 || Math.hypot(npc.x - player.x, npc.y - player.y) <= TALK_DISTANCE) {
          player.direction = Math.atan2(npc.y - player.y, npc.x - player.x);
          player.moving = false;
          autoPathRef.current = null;
          actionsRef.current.openDialogue(auto.npcId);
          moving = false;
        } else if (movedDistance < MOVE_SPEED * dt * 0.12) {
          staleTime += dt;
          if (staleTime > 1.1) {
            autoPathRef.current = null;
            setSelectedNpcId(null);
            staleTime = 0;
            showToast("Yo‘l to‘silib qoldi. Harakatdan boshqa yo‘nalishda qayta urinib ko‘ring.");
          }
        } else {
          staleTime = 0;
        }
      }

      player.moving = moving || (!pausedNow && magnitude > 0.08);

      const scale = zoom || 1;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
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
      ] as const) drawTree(ctx, x, y, s);

      for (const obstacle of obstacles) drawBuilding(ctx, obstacle, obstacles.indexOf(obstacle));
      for (const [x, y] of [[460, 370], [710, 460], [1110, 495], [395, 1020], [1120, 735], [1475, 590]]) {
        ctx.fillStyle = "#79573f";
        roundedRect(ctx, x, y, 58, 13, 5);
        ctx.fill();
        ctx.fillStyle = "#d6a276";
        ctx.fillRect(x + 6, y + 3, 4, 22);
        ctx.fillRect(x + 48, y + 3, 4, 22);
      }

      for (const npc of NPC_LIST) {
        drawNpc(ctx, npc, time, selectedNpcRef.current === npc.id, gameProgress.npcs[npc.id]);
      }

      if (player.moving) {
        for (let i = 0; i < 3; i += 1) {
          ctx.fillStyle = `rgba(255,255,255,${.17 - i * .045})`;
          ctx.beginPath();
          ctx.arc(
            player.x - Math.cos(player.direction) * (24 + i * 12),
            player.y + 9 - Math.sin(player.direction) * (24 + i * 12),
            4 - i * .7, 0, Math.PI * 2,
          );
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
      ctx.fillText("AISHA", player.x, player.y + 39);
      ctx.restore();

      const possible = NPC_LIST
        .map((npc) => ({ npc, state: gameProgress.npcs[npc.id], distance: Math.hypot(npc.x - player.x, npc.y - player.y) }))
        .filter(({ distance }) => distance <= 88)
        .sort((a, b) => a.distance - b.distance)[0];
      const possibleId = possible?.npc.id ?? "";
      nearbyNpcRef.current = possible?.npc ?? null;
      if (possibleId !== lastNearbyId) {
        lastNearbyId = possibleId;
        setNearby(possible ? { npc: possible.npc, state: possible.state } : null);
      }

      if (!announced && time > 900) {
        announced = true;
        showToast("Xaritadagi qahramon ustiga bosing — Aisha o‘zi yurib boradi va suhbat boshlanadi.");
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
      canvas.removeEventListener("pointerdown", onCanvasPointerDown);
      held.clear();
    };
  }, [loaded, showToast]);

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

  const completedCount = NPC_LIST.filter((npc) => progress.npcs[npc.id].completed).length;
  const nextNpc = NPC_LIST.find((npc) => !progress.npcs[npc.id].completed);
  const currentLevel = Math.floor(progress.xp / 200) + 1;
  const currentNpc = dialogue ? NPC_DATA[dialogue.npcId] : undefined;
  const currentState = dialogue ? progress.npcs[dialogue.npcId] : undefined;
  const currentStage = currentNpc ? currentNpc.stages[dialogue?.stageIndex ?? 0] : undefined;

  return (
    <div className="container life-game-page">
      <section className="life-game-shell" aria-label="Hayot simulyatori o‘yin maydoni">
        <header className="life-game-hud">
          <div className="life-game-brand">
            <span className="life-game-logo">Z</span>
            <span><strong>Aisha</strong><small>{currentLevel}-daraja · {progress.xp} XP</small></span>
          </div>
          <div className="life-game-objective">
            <span>SUHBATLAR · {completedCount}/{NPC_LIST.length}</span>
            <strong>{nextNpc ? `Keyingi: ${nextNpc.name} — ${nextNpc.topic}` : "Barcha qahramonlar bilan suhbat yakunlandi!"}</strong>
          </div>
          <div className="life-game-actions">
            <button type="button" className="life-game-icon-button" aria-label="Inventar" onClick={() => setShowInventory(true)}>🎒 <span>{progress.inventory.length}</span></button>
            <button type="button" className="life-game-icon-button" aria-label={muted ? "Ovozni yoqish" : "Ovozni o‘chirish"} onClick={() => setMuted((value) => !value)}>{muted ? "🔇" : "🔊"}</button>
            <button type="button" className="life-game-icon-button" aria-label={paused ? "Davom etish" : "Pauza"} onClick={() => setPaused((value) => !value)}>{paused ? "▶" : "Ⅱ"}</button>
          </div>
        </header>

        <div className="life-game-stage" ref={canvasShellRef}>
          <canvas ref={canvasRef} className="life-game-canvas" aria-label="Top-down interaktiv maktab shaharchasi" />
          <div className="life-game-map-key"><span>💬</span> Bosib suhbatlashish <i>●</i> Davom etyapti <b>✓</b> Tugallangan</div>
          {!loaded && <div className="life-game-loading">Sarguzasht yuklanmoqda…</div>}
          {nearby && !dialogue && !paused && (
            <div className="life-game-nearby">
              <span className="life-game-keycap">E</span>
              <span>
                <strong>{nearby.npc.name} · {nearby.npc.role}</strong>
                <small>
                  {nearby.state.completed
                    ? "Suhbat tugallangan — qayta ko‘rish mumkin"
                    : nearby.state.stage > 0
                      ? `Davom etyapti · ${nearby.state.stage}/5`
                      : "Suhbatlashish"}
                </small>
              </span>
              <button type="button" onClick={handleInteract}>Gaplashish</button>
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
          {dialogue && currentNpc && currentState && (
            <div className="life-game-overlay">
              <section className="life-game-dialog" role="dialog" aria-modal="true" aria-labelledby="life-dialog-title">
                <div className="life-game-dialog-top">
                  <span className="life-game-kicker">{dialogue.phase === "reflection" ? "SUHBAT YAKUNI" : dialogue.replay ? "QAYTA KO‘RISH" : currentNpc.topic}</span>
                  <button type="button" className="life-game-close" aria-label="Dialogni yopish" onClick={closeDialogue}>×</button>
                </div>

                <div className="life-game-npc-head">
                  <span className="life-game-npc-avatar" style={{ background: currentNpc.color }}>{currentNpc.avatarEmoji}</span>
                  <span className="life-game-npc-meta">
                    <strong id="life-dialog-title">{currentNpc.name}</strong>
                    <small>{currentNpc.role} · {currentNpc.topic}</small>
                  </span>
                  <span className="life-game-npc-progress">{currentState.completed ? "✓ 5/5" : `${currentState.stage}/5`}</span>
                </div>

                {dialogue.phase === "intro" && (
                  <>
                    <p className="life-game-npc-line">{currentNpc.storyIntro}</p>
                    {dialogue.replay && <p className="life-game-npc-line life-game-npc-note">Buni avval o‘rgangan edingiz. Xohlasangiz yana bir bor ko‘rib chiqing — takroriy XP berilmaydi.</p>}
                    <button type="button" className="life-game-primary" onClick={() => setDialogue({ ...dialogue, phase: "question" })}>
                      {dialogue.replay ? "Qayta boshlash" : "Suhbatni boshlash"}
                    </button>
                  </>
                )}

                {dialogue.phase === "question" && currentStage && (
                  <>
                    <div className="life-game-speaker">{currentNpc.name} so‘raydi</div>
                    <h2 className="life-game-question">{currentStage.question}</h2>
                    <div className="life-game-choices">
                      {currentStage.choices.map((choice, index) => (
                        <button type="button" key={choice.label} onClick={() => chooseOption(index)}>
                          <span>{String.fromCharCode(65 + index)}</span>{choice.label}
                        </button>
                      ))}
                    </div>
                    <div className="life-game-dialog-foot">Savol {(dialogue.stageIndex ?? 0) + 1} / {currentNpc.stages.length} <span>Har bir tanlov o‘z oqibatiga ega.</span></div>
                  </>
                )}

                {dialogue.phase === "response" && currentStage && dialogue.chosen !== undefined && (
                  <>
                    <div className="life-game-speaker">{currentNpc.name}ning javobi</div>
                    <p className="life-game-npc-line life-game-npc-response">{currentStage.choices[dialogue.chosen].response}</p>
                    <div className="life-game-outcome"><span>↗</span><p>{currentStage.choices[dialogue.chosen].outcome}</p></div>
                    <div className="life-game-step-count">QADAM {(dialogue.stageIndex ?? 0) + 1} / {currentNpc.stages.length}</div>
                    <button type="button" className="life-game-primary" onClick={advanceResponse}>
                      {(dialogue.stageIndex ?? 0) >= currentNpc.stages.length - 1 ? "Yakuniy fikrga o‘tish" : "Keyingi savol"}
                    </button>
                  </>
                )}

                {dialogue.phase === "reflection" && (
                  <>
                    <h2>{currentNpc.reflectionQuestion}</h2>
                    <p>Javob ixtiyoriy. Bu bebaholanadi; faqat shu brauzerda saqlanadi.</p>
                    <label className="life-game-reflection-label" htmlFor="life-reflection">Qisqa fikringiz (ixtiyoriy)</label>
                    <textarea id="life-reflection" className="life-game-reflection" maxLength={400} value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="Bu vaziyatga haqiqiy hayotda duch kelsangiz, qanday yo‘l tutardingiz?" />
                    <div className="life-game-reward-preview">
                      <span>🏅</span>
                      <div>
                        <strong>{currentNpc.rewardBadge}</strong>
                        <small>{currentState.completed ? "Takroriy suhbat · XP berilmaydi" : `+${currentNpc.rewardXp} XP mukofot`}</small>
                      </div>
                    </div>
                    <button type="button" className="life-game-primary" onClick={finishConversation}>
                      {currentState.completed ? "Suhbatni yakunlash" : "Mukofotni olish"}
                    </button>
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
                  {progress.inventory.length ? progress.inventory.map((item) => <div key={item}>🏅 <span>{item}</span></div>) : <p>Suhbatni tugatib, birinchi nishoningizni oling.</p>}
                </div>
                <p className="life-game-storage-note">RPG suhbatlari progressi va nishonlar faqat shu brauzer qurilmasida saqlanadi.</p>
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
          <span>⌨ WASD / ← ↑ → ↓ · Qahramon ustiga bosish yoki E — suhbat · P — pauza</span>
          <span className="life-game-progress-list">
            {NPC_LIST.map((npc) => {
              const state = progress.npcs[npc.id];
              return (
                <b key={npc.id} className={state.completed ? "done" : state.stage > 0 ? "active" : ""}>
                  {npc.name} {state.completed ? "✓" : `${state.stage}/5`}
                </b>
              );
            })}
          </span>
        </footer>
      </section>
      <p className="life-game-privacy">O‘yin ichidagi XP — bajarilgan faoliyat uchun tajriba, insonning haqiqiy fazilatlari bahosi emas.</p>
    </div>
  );
}
