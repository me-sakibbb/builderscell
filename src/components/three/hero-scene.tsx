"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Grid, Lightformer, PerspectiveCamera, useGLTF } from "@react-three/drei";
import { usePalette } from "./palette";
import { robotBus, type Gesture, type HeroState } from "./bus";

const ROBOT = "/models/polybot.glb";

/*
 * polybot.glb is a single static mesh in an A-pose, 3.55 units tall, facing +X.
 * We split it into parts by triangle position so the head and arms can move.
 */
const NECK_Y = 2.2;
const SHOULDER_Y = 1.9;
const SHOULDER_Z = 0.72;
const ARM_REST = 0.45; // radians to lower the arms from the A-pose
/** Matches the hero framing used by the camera rig. */
const SCALE = 1.25;
const JUMP_HEIGHT = 1.1;

const GESTURE_TIME: Record<Gesture, number> = { Wave: 2, Dance: 2.6, Jump: 1.2, Spin: 1.4, Nod: 1.1 };

type Part = "body" | "head" | "armA" | "armB";

type Rig = {
  root: THREE.Group;
  head: THREE.Group;
  /** Arm on the model's +Z side. */
  armA: THREE.Group;
  /** Arm on the model's -Z side. */
  armB: THREE.Group;
};

/** Copies the given triangles into a new geometry, re-centred on `pivot`. */
function subGeometry(src: THREE.BufferGeometry, tris: number[], pivot: THREE.Vector3) {
  const out = new THREE.BufferGeometry();
  for (const [name, attr] of Object.entries(src.attributes)) {
    const a = attr as THREE.BufferAttribute;
    const size = a.itemSize;
    const data = new Float32Array(tris.length * 3 * size);
    tris.forEach((t, i) => {
      for (let v = 0; v < 3; v++) {
        for (let c = 0; c < size; c++) data[(i * 3 + v) * size + c] = a.getComponent(t + v, c);
      }
    });
    out.setAttribute(name, new THREE.BufferAttribute(data, size));
  }
  out.translate(-pivot.x, -pivot.y, -pivot.z);
  out.computeBoundingSphere();
  return out;
}

function buildRig(scene: THREE.Object3D): Rig {
  scene.updateMatrixWorld(true);
  let src: THREE.Mesh | undefined;
  scene.traverse((o) => {
    if (!src && (o as THREE.Mesh).isMesh) src = o as THREE.Mesh;
  });
  if (!src) throw new Error("polybot.glb has no mesh");

  // meshopt stores attributes as quantized, normalized integers; convert to
  // plain floats first, or baking the node's x100 scale would clamp them.
  const float = new THREE.BufferGeometry();
  for (const [name, attr] of Object.entries(src.geometry.attributes)) {
    const a = attr as THREE.BufferAttribute;
    const data = new Float32Array(a.count * a.itemSize);
    for (let i = 0; i < a.count; i++) {
      for (let c = 0; c < a.itemSize; c++) data[i * a.itemSize + c] = a.getComponent(i, c);
    }
    float.setAttribute(name, new THREE.BufferAttribute(data, a.itemSize));
  }
  if (src.geometry.index) float.setIndex(src.geometry.index.clone());
  float.applyMatrix4(src.matrixWorld);
  const geo = float.index ? float.toNonIndexed() : float;
  const pos = geo.attributes.position;

  const tris: Record<Part, number[]> = { body: [], head: [], armA: [], armB: [] };
  for (let t = 0; t < pos.count; t += 3) {
    const y = (pos.getY(t) + pos.getY(t + 1) + pos.getY(t + 2)) / 3;
    const z = (pos.getZ(t) + pos.getZ(t + 1) + pos.getZ(t + 2)) / 3;
    let part: Part = "body";
    if (y > NECK_Y) part = "head";
    else if (Math.abs(z) > SHOULDER_Z && y > 0.95) part = z > 0 ? "armA" : "armB";
    tris[part].push(t);
  }

  const material = src.material as THREE.MeshStandardMaterial;
  material.roughness = 0.55;
  material.metalness = 0;

  const root = new THREE.Group();
  const make = (part: Part, pivot: THREE.Vector3) => {
    const mesh = new THREE.Mesh(subGeometry(geo, tris[part], pivot), material);
    mesh.castShadow = true;
    const group = new THREE.Group();
    group.position.copy(pivot);
    group.add(mesh);
    root.add(group);
    return group;
  };
  make("body", new THREE.Vector3());
  const head = make("head", new THREE.Vector3(0, NECK_Y, 0));
  const armA = make("armA", new THREE.Vector3(0, SHOULDER_Y, SHOULDER_Z));
  const armB = make("armB", new THREE.Vector3(0, SHOULDER_Y, -SHOULDER_Z));
  return { root, head, armA, armB };
}

type Pose = {
  yaw: number;
  pitch: number;
  tilt: number;
  /** Positive lowers each arm toward the body; negative raises it. */
  armA: number;
  armB: number;
  squash: number;
  sway: number;
};

/**
 * Writes one frame's pose. The model faces +X, so in its own space yaw is Y,
 * nodding is Z, and side-to-side is X. Every value is absolute; nothing drifts.
 */
function poseRig({ root, head, armA, armB }: Rig, o: Pose) {
  head.rotation.set(o.tilt, o.yaw, o.pitch);
  armA.rotation.x = o.armA;
  armB.rotation.x = -o.armB;
  root.rotation.x = o.sway;
  root.scale.set(1 - o.squash * 0.5, 1 + o.squash, 1 - o.squash * 0.5);
}

function Robot({ state }: { state: RefObject<HeroState> }) {
  const { scene } = useGLTF(ROBOT);
  const body = useRef<THREE.Group>(null);
  const rig = useMemo(() => buildRig(scene), [scene]);

  const gesture = useRef<{ kind: Gesture; t0: number; landed?: boolean } | null>(null);
  const clock = useThree((s) => s.clock);
  useEffect(() => {
    const off = robotBus.on((kind) => {
      gesture.current = { kind, t0: clock.elapsedTime };
    });
    // Wave hello once the scene first appears.
    const t = window.setTimeout(() => robotBus.emit("Wave"), 1400);
    window.dispatchEvent(new Event("bc:scene-ready"));
    return () => {
      off();
      window.clearTimeout(t);
    };
  }, [clock]);

  const look = useRef({ yaw: 0, pitch: 0, turn: 0 });
  const squash = useRef({ s: 0, v: 0 });
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const { pointer, progress } = state.current;
    const l = look.current;

    // Idle: a happy little bounce with arms swinging in time.
    const beat = Math.sin(t * 2.4);
    const pose: Pose = {
      yaw: 0,
      pitch: 0,
      tilt: Math.sin(t * 0.9) * 0.08,
      armA: ARM_REST + beat * 0.08,
      armB: ARM_REST - beat * 0.08,
      squash: Math.max(0, beat) * 0.025,
      sway: 0,
    };
    let spin = 0;
    let jump = 0;

    const g = gesture.current;
    if (g) {
      const u = Math.min((t - g.t0) / GESTURE_TIME[g.kind], 1);
      const env = Math.sin(Math.PI * u);
      const k = THREE.MathUtils.smoothstep(u, 0, 0.15) * (1 - THREE.MathUtils.smoothstep(u, 0.85, 1));
      if (g.kind === "Wave") {
        pose.armA = THREE.MathUtils.lerp(pose.armA, -1.75 + Math.sin(t * 14) * 0.3, k);
        pose.tilt += 0.18 * k;
      }
      if (g.kind === "Dance") {
        const d = Math.sin(u * Math.PI * 8);
        pose.armA = THREE.MathUtils.lerp(pose.armA, -1.2 + d * 0.9, k);
        pose.armB = THREE.MathUtils.lerp(pose.armB, -1.2 - d * 0.9, k);
        pose.sway = d * 0.14 * k;
        pose.tilt += -d * 0.2 * k;
        jump = Math.abs(Math.sin(u * Math.PI * 8)) * 0.18 * k;
      }
      if (g.kind === "Jump") {
        // Crouch (0-0.2), fly on a true parabola (0.2-0.75), then settle.
        const a = THREE.MathUtils.clamp((u - 0.2) / 0.55, 0, 1);
        jump = 4 * a * (1 - a) * JUMP_HEIGHT;
        if (u < 0.2) pose.squash = -0.14 * THREE.MathUtils.smoothstep(u, 0, 0.15);
        else if (a < 1) pose.squash = 0.09 * Math.abs(1 - 2 * a); // stretch with speed, round at the top
        // The landing impact kicks the spring; it squashes and wobbles back on its own.
        if (a >= 1 && !g.landed) {
          g.landed = true;
          squash.current.v -= 2.4;
        }
        const arms = u < 0.2 ? 0 : a < 1 ? Math.sin(a * Math.PI) : 0;
        pose.armA = THREE.MathUtils.lerp(pose.armA, -1.8, arms);
        pose.armB = THREE.MathUtils.lerp(pose.armB, -1.8, arms);
      }
      if (g.kind === "Spin") {
        spin = THREE.MathUtils.smootherstep(u, 0, 1) * Math.PI * 2;
        pose.armA = pose.armB = THREE.MathUtils.lerp(ARM_REST, -0.4, env);
      }
      if (g.kind === "Nod") pose.pitch = -Math.sin(u * Math.PI * 4) * 0.3 * env;
      if (u >= 1) gesture.current = null;
    }

    // Follow the cursor with the head, and a little with the whole body.
    l.yaw = THREE.MathUtils.damp(l.yaw, THREE.MathUtils.clamp(pointer.x, -1, 1) * 0.6, 5, dt);
    l.pitch = THREE.MathUtils.damp(l.pitch, THREE.MathUtils.clamp(pointer.y, -1, 1) * 0.3, 5, dt);
    l.turn = THREE.MathUtils.damp(l.turn, pointer.x * 0.3 - progress * 0.9, 4, dt);
    pose.yaw += l.yaw;
    pose.pitch += l.pitch;

    // Squash and stretch follow their target through an underdamped spring, so
    // phase changes (crouch, take-off, landing, back to idle) never snap.
    const sp = squash.current;
    const h = Math.min(dt, 1 / 30);
    sp.v += ((pose.squash - sp.s) * 260 - sp.v * 14) * h;
    sp.s += sp.v * h;
    pose.squash = sp.s;
    poseRig(rig, pose);

    if (body.current) {
      body.current.rotation.y = l.turn + spin;
      body.current.position.y = jump;
    }
  });

  return (
    <group ref={body}>
      {/* Turn the model so its face (+X) looks at the camera (+Z). */}
      <group rotation-y={-Math.PI / 2} scale={SCALE}>
        <primitive object={rig.root} />
      </group>
    </group>
  );
}

/** Wide views push the robot right of the headline; tall views lift it above the copy. */
function useLayout() {
  const { width, height } = useThree((s) => s.size);
  const aspect = width / Math.max(height, 1);
  return aspect > 1.15 ? { shift: 3.4, lift: 0, far: 0 } : { shift: 0, lift: -3.6, far: 10 };
}

function Rig({ state }: { state: RefObject<HeroState> }) {
  const cam = useRef<THREE.PerspectiveCamera>(null);
  const { lift, far } = useLayout();
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    const c = cam.current;
    if (!c) return;
    const t = state.current.progress;
    const { x, y } = state.current.pointer;
    // Dolly in and rise as the hero scrolls away; parallax with the pointer.
    const px = x * 0.6 - t * 2.4;
    const py = 2.6 + y * 0.3 + t * 5.5;
    const pz = 15 + far + t * 4;
    c.position.x = THREE.MathUtils.damp(c.position.x, px, 3, dt);
    c.position.y = THREE.MathUtils.damp(c.position.y, py, 3, dt);
    c.position.z = THREE.MathUtils.damp(c.position.z, pz, 3, dt);
    target.set(0, 2.1 + lift + t * 0.4, 0);
    c.lookAt(target);
  });
  return <PerspectiveCamera ref={cam} makeDefault fov={32} position={[0, 2.6, 15]} near={0.1} far={80} />;
}

/** Soft radial halo behind the robot. */
function Glow({ color, additive }: { color: string; additive: boolean }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.35, "rgba(255,255,255,0.35)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return (
    <mesh position={[0, 2.4, -4]}>
      <planeGeometry args={[16, 16]} />
      <meshBasicMaterial
        map={tex}
        color={color}
        transparent
        opacity={additive ? 0.35 : 0.28}
        depthWrite={false}
        toneMapped={false}
        blending={additive ? THREE.AdditiveBlending : THREE.NormalBlending}
      />
    </mesh>
  );
}

export default function HeroScene({ state }: { state: RefObject<HeroState> }) {
  const p = usePalette();
  const { shift } = useLayout();
  return (
    <>
      <Rig state={state} />
      <group position-x={shift}>
        <Glow color={p.accent} additive={p.dark} />
        <Robot state={state} />
        <ContactShadows position={[0, 0.005, 0]} opacity={p.dark ? 0.6 : 0.35} scale={12} blur={2.4} far={5} />
      </group>
      <ambientLight intensity={p.ambient} />
      <directionalLight position={[4, 8, 6]} intensity={p.key} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-4, 3, -3]} intensity={30} color={p.accent} distance={14} />
      <pointLight position={[4, 1.5, -4]} intensity={14} color={p.signal} distance={10} />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2} position={[0, 5, -6]} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[-6, 2, 2]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="ring" color={p.accent} intensity={3} position={[5, 3, 2]} scale={2} />
      </Environment>
      <Grid
        position={[0, 0, 0]}
        infiniteGrid
        cellSize={0.5}
        sectionSize={2.5}
        cellThickness={0.6}
        sectionThickness={1}
        cellColor={p.grid}
        sectionColor={p.gridSection}
        fadeDistance={26}
        fadeStrength={2.2}
      />
    </>
  );
}

useGLTF.preload(ROBOT);
