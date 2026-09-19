"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Grid, Lightformer, PerspectiveCamera, RoundedBox } from "@react-three/drei";
import { usePalette } from "./palette";
import { FitModel } from "./fit-model";
import { Motor, Sensor, Wheel } from "./parts";
import type { RoverControls, RoverTelemetry } from "./bus";

const { damp, clamp, degToRad } = THREE.MathUtils;

/* Arena, in scene units (1 unit ≈ 10 cm). */
const HALF = 5;
const OBSTACLES = [
  { x: -2, z: -1.4, r: 0.6 },
  { x: 2.3, z: 1.6, r: 0.75 },
  { x: 1.2, z: -2.6, r: 0.45 },
];
const BODY_R = 0.95;
const MAX_SPEED = 2.4;
const TURN_RATE = 2.2;
const SENSOR_RANGE = 40; // units → 400 cm
const STOP_AT = 1.3;

/** Distance from (x,z) along angle `a` to the nearest wall or obstacle. */
function castRay(x: number, z: number, a: number) {
  const dx = Math.sin(a);
  const dz = Math.cos(a);
  let best = SENSOR_RANGE;
  // Walls: the ray starts inside the square, so take the nearest positive exit.
  if (dx > 1e-6) best = Math.min(best, (HALF - x) / dx);
  if (dx < -1e-6) best = Math.min(best, (-HALF - x) / dx);
  if (dz > 1e-6) best = Math.min(best, (HALF - z) / dz);
  if (dz < -1e-6) best = Math.min(best, (-HALF - z) / dz);
  for (const o of OBSTACLES) {
    const ox = x - o.x;
    const oz = z - o.z;
    const b = ox * dx + oz * dz;
    const c = ox * ox + oz * oz - o.r * o.r;
    const disc = b * b - c;
    if (disc < 0) continue;
    const t = -b - Math.sqrt(disc);
    if (t > 0) best = Math.min(best, t);
  }
  return Math.max(0, best);
}

type Props = {
  controls: RefObject<RoverControls>;
  telemetryRef: RefObject<RoverTelemetry>;
  onTelemetry?: () => void;
};

function Rover({ controls, telemetryRef, onTelemetry }: Props) {
  const p = usePalette();
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const wheelL = useRef<THREE.Group>(null);
  const wheelR = useRef<THREE.Group>(null);
  const led = useRef<THREE.MeshStandardMaterial>(null);
  const beam = useRef<THREE.Mesh>(null);
  const beamMat = useRef<THREE.MeshBasicMaterial>(null);

  const sim = useRef({ x: 0, z: 2.2, heading: Math.PI, v: 0, w: 0, servo: 90, wander: 0, lastReset: 0, tick: 0 });
  const green = useMemo(() => new THREE.Color(p.accent), [p.accent]);
  const red = useMemo(() => new THREE.Color(p.signal), [p.signal]);

  useEffect(() => {
    sim.current.lastReset = controls.current.reset;
  }, [controls]);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const s = sim.current;
    const c = controls.current;
    const tm = telemetryRef.current;
    const t = clock.elapsedTime;

    if (c.reset !== s.lastReset) {
      Object.assign(s, { x: 0, z: 2.2, heading: Math.PI, v: 0, w: 0, lastReset: c.reset });
    }

    // Servo: manual angle, or a sweeping scan in autopilot.
    const servoTarget = c.autopilot ? 90 + Math.sin(t * 2.4) * 55 : c.servo;
    s.servo = damp(s.servo, servoTarget, 10, dt);
    const servoRad = degToRad(s.servo - 90);

    const front = castRay(s.x, s.z, s.heading);
    const sensed = castRay(s.x, s.z, s.heading - servoRad);

    let throttle = c.throttle;
    let steer = c.steer;
    if (c.autopilot) {
      const left = castRay(s.x, s.z, s.heading + 0.7);
      const right = castRay(s.x, s.z, s.heading - 0.7);
      s.wander += (Math.random() - 0.5) * dt * 2;
      s.wander = clamp(s.wander, -0.4, 0.4);
      if (front < STOP_AT * 1.7) {
        throttle = front < STOP_AT * 0.8 ? -0.3 : 0.15;
        steer = left > right ? 1 : -1;
      } else {
        throttle = 0.75;
        steer = s.wander + clamp((left - right) * 0.08, -0.5, 0.5);
      }
    }

    const blocked = c.guard && throttle > 0 && front < STOP_AT;
    const targetV = blocked ? 0 : throttle * MAX_SPEED;
    s.v = damp(s.v, targetV, 5, dt);
    s.w = damp(s.w, steer * TURN_RATE, 6, dt);

    s.heading += s.w * dt;
    s.x += Math.sin(s.heading) * s.v * dt;
    s.z += Math.cos(s.heading) * s.v * dt;

    // Keep the body inside the arena and out of the obstacles.
    const lim = HALF - BODY_R;
    if (Math.abs(s.x) > lim || Math.abs(s.z) > lim) s.v *= 0.2;
    s.x = clamp(s.x, -lim, lim);
    s.z = clamp(s.z, -lim, lim);
    for (const o of OBSTACLES) {
      const dx = s.x - o.x;
      const dz = s.z - o.z;
      const d = Math.hypot(dx, dz);
      const min = o.r + BODY_R * 0.8;
      if (d < min && d > 1e-4) {
        s.x = o.x + (dx / d) * min;
        s.z = o.z + (dz / d) * min;
        s.v *= 0.2;
      }
    }

    // Differential drive. Facing +Z, the rover's left wheel sits at +X; a positive
    // turn rate (toward +X) needs the right wheel to run faster.
    const vl = s.v - s.w * 0.6;
    const vr = s.v + s.w * 0.6;
    if (body.current) {
      body.current.position.set(s.x, 0, s.z);
      body.current.rotation.y = s.heading;
    }
    if (wheelL.current) wheelL.current.rotation.x += (vl / 0.33) * dt;
    if (wheelR.current) wheelR.current.rotation.x += (vr / 0.33) * dt;
    if (head.current) head.current.rotation.y = -servoRad;

    const near = sensed < STOP_AT * 1.4;
    if (led.current) {
      led.current.emissive.copy(blocked || near ? red : green);
      led.current.emissiveIntensity = 2 + Math.sin(t * (blocked ? 18 : 4)) * 0.8;
    }
    if (beam.current && beamMat.current) {
      const len = Math.min(sensed, 12);
      beam.current.scale.set(1, len, 1);
      beam.current.position.z = len / 2 + 0.2;
      beamMat.current.color.copy(near ? red : green);
      beamMat.current.opacity = 0.22 + Math.sin(t * 10) * 0.05;
    }

    tm.distance = Math.round(sensed * 10);
    tm.pwmL = Math.round(clamp(vl / MAX_SPEED, -1, 1) * 255);
    tm.pwmR = Math.round(clamp(vr / MAX_SPEED, -1, 1) * 255);
    tm.servo = Math.round(s.servo);
    tm.blocked = blocked;
    s.tick += dt;
    if (s.tick > 0.12) {
      s.tick = 0;
      onTelemetry?.();
    }
  });

  return (
    <group ref={body}>
      {/* acrylic chassis plate */}
      <RoundedBox args={[1.5, 0.06, 2.1]} radius={0.03} position={[0, 0.42, 0]} castShadow>
        <meshPhysicalMaterial color={p.dark ? "#cfe9ff" : "#a9c9e0"} roughness={0.15} metalness={0} transparent opacity={0.55} />
      </RoundedBox>
      {/* motors and wheels at the rear, caster at the front */}
      <Motor position={[-0.42, 0.22, -0.45]} rotation={[0, Math.PI, 0]} />
      <Motor position={[0.42, 0.22, -0.45]} />
      <Wheel position={[0.95, 0.33, -0.45]} spin={wheelL} />
      <Wheel position={[-0.95, 0.33, -0.45]} spin={wheelR} />
      <mesh position={[0, 0.14, 0.75]} castShadow>
        <sphereGeometry args={[0.14, 20, 16]} />
        <meshStandardMaterial color="#c9ced2" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.3, 0.75]}>
        <cylinderGeometry args={[0.09, 0.12, 0.24, 16]} />
        <meshStandardMaterial color="#1b1d1f" />
      </mesh>
      {/* brains and power on the deck */}
      <FitModel url="/models/uno.glb" size={1.05} position={[0, 0.46, -0.2]} rotation={[0, Math.PI / 2, 0]} />
      <FitModel url="/models/battery.glb" size={0.5} position={[-0.35, 0.46, -0.85]} rotation={[0, 0, Math.PI / 2]} />
      <FitModel url="/models/battery.glb" size={0.5} position={[0.35, 0.46, -0.85]} rotation={[0, 0, Math.PI / 2]} />
      {/* status LED */}
      <mesh position={[0.5, 0.52, 0.55]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial ref={led} color="#111" emissive={p.accent} emissiveIntensity={2} toneMapped={false} />
      </mesh>
      {/* servo + sensor head */}
      <group position={[0, 0.45, 0.82]}>
        <mesh position={[0, 0.08, 0]} castShadow>
          <boxGeometry args={[0.24, 0.16, 0.12]} />
          <meshStandardMaterial color="#2b62c9" roughness={0.5} />
        </mesh>
        <group ref={head} position={[0, 0.16, 0]}>
          <Sensor scale={1.1} />
          <mesh ref={beam} position={[0, 0.22, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.01, 1, 16, 1, true]} />
            <meshBasicMaterial ref={beamMat} transparent depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function Arena() {
  const p = usePalette();
  const wall = <meshStandardMaterial color={p.dark ? "#1a2024" : "#e3e4df"} roughness={0.8} />;
  return (
    <group>
      <Grid
        args={[HALF * 2, HALF * 2]}
        cellSize={0.5}
        sectionSize={2.5}
        cellThickness={0.6}
        sectionThickness={1.1}
        cellColor={p.grid}
        sectionColor={p.gridSection}
        fadeDistance={40}
        position={[0, 0.002, 0]}
      />
      {[
        [0, -HALF, HALF * 2 + 0.3, 0.15],
        [0, HALF, HALF * 2 + 0.3, 0.15],
        [-HALF, 0, 0.15, HALF * 2],
        [HALF, 0, 0.15, HALF * 2],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, 0.2, z]} castShadow receiveShadow>
          <boxGeometry args={[w, 0.4, d]} />
          {wall}
        </mesh>
      ))}
      {OBSTACLES.map((o, i) => (
        <group key={i} position={[o.x, 0, o.z]}>
          <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[o.r, o.r, 0.9, 40]} />
            <meshStandardMaterial color={i === 1 ? p.accent : p.dark ? "#2a3035" : "#cfd1cb"} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.91, 0]}>
            <torusGeometry args={[o.r * 0.7, 0.015, 8, 48]} />
            <meshStandardMaterial color={p.signal} emissive={p.signal} emissiveIntensity={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function RoverScene(props: Props) {
  const p = usePalette();
  return (
    <>
      <PerspectiveCamera makeDefault fov={30} position={[7, 10, 10.5]} onUpdate={(c) => c.lookAt(0, -0.4, 0.3)} />
      <ambientLight intensity={p.ambient} />
      <directionalLight position={[5, 10, 4]} intensity={p.key} castShadow shadow-mapSize={[1024, 1024]}>
        <orthographicCamera attach="shadow-camera" args={[-7, 7, 7, -7, 0.1, 30]} />
      </directionalLight>
      <Environment resolution={64}>
        <Lightformer form="rect" intensity={2} position={[0, 6, 6]} scale={[10, 3, 1]} />
      </Environment>
      <Arena />
      <Rover {...props} />
      <ContactShadows position={[0, 0.001, 0]} opacity={p.dark ? 0.5 : 0.3} scale={12} blur={2} far={4} />
    </>
  );
}
