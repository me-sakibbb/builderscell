/*
 * Plain mutable objects shared between DOM sections and 3D scenes. Scroll and
 * pointer values change every frame, so they skip React state entirely.
 */

export type HeroState = { progress: number; pointer: { x: number; y: number } };
export const createHeroState = (): HeroState => ({ progress: 0, pointer: { x: 0, y: 0 } });

export type KitState = { progress: number };
export const createKitState = (): KitState => ({ progress: 0 });

export type RoverControls = {
  throttle: number; // -1..1
  steer: number; // -1..1, positive turns left
  servo: number; // degrees, 0..180 (90 = straight ahead)
  autopilot: boolean;
  guard: boolean; // stop before obstacles
  reset: number; // bump to reset the pose
};
export const createRoverControls = (): RoverControls => ({
  throttle: 0,
  steer: 0,
  servo: 90,
  autopilot: false,
  guard: true,
  reset: 0,
});

/** Telemetry the rover writes and the serial-monitor UI reads. */
export type RoverTelemetry = {
  distance: number; // cm
  pwmL: number;
  pwmR: number;
  servo: number;
  blocked: boolean;
};

export type Gesture = "Wave" | "Dance" | "Jump" | "Spin" | "Nod";

type Listener = (g: Gesture) => void;
const listeners = new Set<Listener>();

export const robotBus = {
  emit: (g: Gesture) => listeners.forEach((l) => l(g)),
  on: (l: Listener) => {
    listeners.add(l);
    return () => void listeners.delete(l);
  },
};
