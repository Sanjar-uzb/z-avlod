"use client";

import { create } from "zustand";

export type EnergySample = {
  time: number;
  velocity: number;
  kinetic: number;
  potential: number;
  total: number;
  height: number;
  progress: number;
};

type SimState = {
  velocity: number;
  height: number;
  progress: number;
  time: number;
  data: EnergySample[];
  setLive: (payload: { velocity: number; height: number; progress: number; time: number }) => void;
  addSample: (point: EnergySample) => void;
  reset: () => void;
};

const MAX_POINTS = 140;

export const useSimStore = create<SimState>((set) => ({
  velocity: 0,
  height: 0,
  progress: 0,
  time: 0,
  data: [],
  setLive: (payload) =>
    set({
      velocity: payload.velocity,
      height: payload.height,
      progress: payload.progress,
      time: payload.time,
    }),
  addSample: (point) =>
    set((state) => ({
      data: [...state.data, point].slice(-MAX_POINTS),
    })),
  reset: () =>
    set({
      velocity: 0,
      height: 0,
      progress: 0,
      time: 0,
      data: [],
    }),
}));
