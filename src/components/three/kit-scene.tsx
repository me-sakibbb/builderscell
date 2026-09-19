"use client";

import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, PerspectiveCamera } from "@react-three/drei";
import { usePalette } from "./palette";
import { FitModel } from "./fit-model";
import { KitBox, Motor, Sensor, Wheel, Wires } from "./parts";
import type { KitState } from "./bus";

const { clamp, damp, smoothstep, lerp } = THREE.MathUtils;

type Slot = {
  key: string;
  /** Where the part rests inside the box. */
  from: [number, number, number];
  /** Where it floats in the exploded layout. */
  to: [number, number, number];
  rot: [number, number, number];
  /** Scroll window (0..1) in which it flies out. */
  at: number;
};

// Layout is authored for a camera looking at the box from the front-right.
const SLOTS: Slot[] = [
  { key: "board", from: [0, 0.25, 0], to: [0, 3.1, 0.2], rot: [0.55, -0.35, 0], at: 0.18 },
  { key: "shield", from: [-0.6, 0.2, 0.3], to: [-2.5, 2.6, -0.4], rot: [0.5, 0.4, 0.1], at: 0.28 },
  { key: "motorA", from: [0.7, 0.2, 0.4], to: [2.1, 3.0, 0.1], rot: [0.3, -0.6, 0.2], at: 0.38 },
  { key: "motorB", from: [0.7, 0.2, -0.3], to: [2.4, 1.9, -0.7], rot: [0.2, -0.9, -0.1], at: 0.42 },
  { key: "wheelA", from: [-0.9, 0.35, -0.4], to: [-2.6, 1.2, 0.6], rot: [0.1, 0.9, 0.2], at: 0.5 },
  { key: "wheelB", from: [-1.1, 0.35, 0.4], to: [-1.7, 0.4, 1.7], rot: [0.2, 0.6, -0.1], at: 0.54 },
  { key: "sensor", from: [0.2, 0.2, 0.6], to: [1.2, 4.0, -0.8], rot: [0.2, -0.3, 0], at: 0.62 },
  { key: "batA", from: [1.1, 0.2, 0], to: [1.9, 0.4, 1.7], rot: [0, 0, Math.PI / 2], at: 0.72 },
  { key: "batB", from: [1.2, 0.2, -0.2], to: [2.6, 0.5, 1.3], rot: [0.3, 0.2, Math.PI / 2], at: 0.74 },
  { key: "wires", from: [-0.2, 0.15, -0.5], to: [-1.3, 3.9, -1.0], rot: [0.6, 0.3, 0], at: 0.82 },
];

function useExplode(state: RefObject<KitState>) {
  const refs = useRef<Record<string, THREE.Group | null>>({});
  const flaps = useRef<(THREE.Group | null)[]>([]);
  const eased = useRef(0);
  const v = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }, dt) => {
    eased.current = damp(eased.current, state.current.progress, 6, dt);
    const p = eased.current;
    const t = clock.elapsedTime;

    // Lid flaps swing open over the first 15% of the scroll.
    const open = smoothstep(p, 0.02, 0.16);
    const f = flaps.current;
    if (f[0]) f[0].rotation.x = open * 2.2;
    if (f[1]) f[1].rotation.x = -open * 2.2;
    if (f[2]) f[2].rotation.z = open * 2.3;
    if (f[3]) f[3].rotation.z = -open * 2.3;

    SLOTS.forEach((s, i) => {
      const g = refs.current[s.key];
      if (!g) return;
      const k = smoothstep(p, s.at - 0.1, s.at + 0.06);
      // Arc up and out rather than sliding in a straight line.
      v.set(lerp(s.from[0], s.to[0], k), lerp(s.from[1], s.to[1], k) + Math.sin(k * Math.PI) * 0.9, lerp(s.from[2], s.to[2], k));
      const bob = k * Math.sin(t * 1.2 + i) * 0.06;
      g.position.set(v.x, v.y + bob, v.z);
      g.rotation.set(s.rot[0] * k, s.rot[1] * k + k * Math.sin(t * 0.4 + i) * 0.12, s.rot[2] * k);
      const sc = lerp(0.55, 1, k);
      g.scale.setScalar(sc);
      g.visible = k > 0.001 || p < 0.2;
    });
  });

  const bind = (key: string) => (g: THREE.Group | null) => {
    refs.current[key] = g;
  };
  return { bind, flaps, eased };
}

function Rig({ eased }: { eased: React.RefObject<number> }) {
  const cam = useRef<THREE.PerspectiveCamera>(null);
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const c = cam.current;
    if (!c) return;
    const p = eased.current ?? 0;
    // Orbit from a high three-quarter view of the closed box to a wide front view.
    const a = lerp(0.75, 0.15, clamp(p * 1.3, 0, 1));
    const r = lerp(8, 12, smoothstep(p, 0, 0.7));
    const h = lerp(5.2, 3.2, smoothstep(p, 0, 0.7));
    c.position.set(Math.sin(a) * r, h, Math.cos(a) * r);
    look.set(0, lerp(0.6, 2.0, smoothstep(p, 0, 0.7)), 0);
    c.lookAt(look);
  });
  return <PerspectiveCamera ref={cam} makeDefault fov={34} position={[5, 5, 5]} />;
}

export default function KitScene({ state }: { state: RefObject<KitState> }) {
  const p = usePalette();
  const { bind, flaps, eased } = useExplode(state);
  return (
    <>
      <Rig eased={eased} />
      <ambientLight intensity={p.ambient} />
      <directionalLight position={[3, 9, 5]} intensity={p.key} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-4, 4, 2]} intensity={20} color={p.accent} distance={12} />
      <Environment resolution={64}>
        <Lightformer form="rect" intensity={2} position={[0, 6, 4]} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={1} position={[-6, 2, 0]} rotation-y={Math.PI / 2} scale={[4, 3, 1]} />
      </Environment>

      {/* Nudged right and down-scaled so flying parts clear the copy column. */}
      <group position-x={0.5} scale={0.88}>
        <KitBox color={p.cardboard} accent={p.accent} flaps={flaps} />

        <group ref={bind("board")}>
          <FitModel url="/models/uno.glb" size={1.9} />
        </group>
        <group ref={bind("shield")}>
          <FitModel url="/models/board.glb" size={1.5} />
        </group>
        <group ref={bind("motorA")}>
          <Motor scale={1.4} />
        </group>
        <group ref={bind("motorB")}>
          <Motor scale={1.4} />
        </group>
        <group ref={bind("wheelA")}>
          <Wheel scale={1.5} position={[0, 0.5, 0]} />
        </group>
        <group ref={bind("wheelB")}>
          <Wheel scale={1.5} position={[0, 0.5, 0]} />
        </group>
        <group ref={bind("sensor")}>
          <Sensor scale={2.2} />
        </group>
        <group ref={bind("batA")}>
          <FitModel url="/models/battery.glb" size={0.9} />
        </group>
        <group ref={bind("batB")}>
          <FitModel url="/models/battery.glb" size={0.9} />
        </group>
        <group ref={bind("wires")}>
          <Wires scale={1.8} />
        </group>
      </group>

      <ContactShadows position={[0.5, 0.001, 0]} opacity={p.dark ? 0.55 : 0.3} scale={14} blur={2.6} far={6} />
    </>
  );
}
