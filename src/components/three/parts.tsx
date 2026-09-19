"use client";

import { forwardRef, useMemo } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";

/*
 * Procedural kit parts. Every part is built at roughly real-world proportions
 * where 1 unit ≈ 10 cm, and sits with its base at y = 0.
 */

type G = React.ComponentProps<"group">;

/** Yellow TT gear motor with a white output shaft and silver can. */
export const Motor = forwardRef<THREE.Group, G>(function Motor(props, ref) {
  return (
    <group ref={ref} {...props}>
      <RoundedBox args={[0.7, 0.22, 0.37]} radius={0.03} position={[0, 0.11, 0]} castShadow>
        <meshStandardMaterial color="#f2c230" roughness={0.55} />
      </RoundedBox>
      <mesh position={[0.46, 0.11, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.24, 24]} />
        <meshStandardMaterial color="#c9ced2" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[-0.1, 0.11, 0.25]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.14, 12]} />
        <meshStandardMaterial color="#f7f7f2" roughness={0.4} />
      </mesh>
      <mesh position={[0.6, 0.11, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.06, 6]} />
        <meshStandardMaterial color="#b36b2c" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
});

/** 65 mm wheel: rubber tyre, coloured hub, spokes. Axis along local X. */
export const Wheel = forwardRef<THREE.Group, G & { hub?: string; spin?: React.Ref<THREE.Group> }>(function Wheel(
  { hub = "#f2c230", spin, ...props },
  ref,
) {
  return (
    <group ref={ref} {...props}>
      <group ref={spin}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.33, 0.33, 0.26, 40]} />
          <meshStandardMaterial color="#16181a" roughness={0.9} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.33, 0.02, 8, 40]} />
          <meshStandardMaterial color="#0c0d0e" roughness={1} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.28, 32]} />
          <meshStandardMaterial color={hub} roughness={0.45} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} rotation={[(i / 5) * Math.PI * 2, 0, 0]} position={[0.15, 0, 0]}>
            <boxGeometry args={[0.02, 0.4, 0.05]} />
            <meshStandardMaterial color="#1b1d1f" />
          </mesh>
        ))}
      </group>
    </group>
  );
});

/** HC-SR04 style ultrasonic sensor: blue PCB with two transducers facing +Z. */
export const Sensor = forwardRef<THREE.Group, G>(function Sensor(props, ref) {
  return (
    <group ref={ref} {...props}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.45, 0.2, 0.016]} />
        <meshStandardMaterial color="#1f5fbf" roughness={0.5} />
      </mesh>
      {[-0.13, 0.13].map((x) => (
        <group key={x} position={[x, 0.2, 0.06]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.11, 32]} />
            <meshStandardMaterial color="#d7dade" metalness={0.85} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0, 0.056]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.065, 0.065, 0.004, 32]} />
            <meshStandardMaterial color="#1a1a1a" roughness={1} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.27, 0.02]}>
        <boxGeometry args={[0.07, 0.03, 0.03]} />
        <meshStandardMaterial color="#c0c4c8" metalness={0.9} roughness={0.2} />
      </mesh>
      {[-0.045, -0.015, 0.015, 0.045].map((x) => (
        <mesh key={x} position={[x, 0.07, -0.01]}>
          <boxGeometry args={[0.012, 0.1, 0.012]} />
          <meshStandardMaterial color="#d4a94a" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
});

const WIRE_COLORS = ["#e0233a", "#16181a", "#f2c230", "#1f5fbf", "#00b86b"];

/** A loose bundle of jumper wires with pin ends. */
export const Wires = forwardRef<THREE.Group, G>(function Wires(props, ref) {
  const curves = useMemo(
    () =>
      WIRE_COLORS.map((_, i) => {
        const o = (i - 2) * 0.07;
        return new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.5, 0.04, o),
          new THREE.Vector3(-0.2, 0.18 + i * 0.03, o + 0.12),
          new THREE.Vector3(0.15, 0.1 + i * 0.02, o - 0.1),
          new THREE.Vector3(0.5, 0.04, o * 1.4),
        ]);
      }),
    [],
  );
  return (
    <group ref={ref} {...props}>
      {curves.map((c, i) => {
        const a = c.getPoint(0);
        const b = c.getPoint(1);
        return (
          <group key={i}>
            <mesh castShadow>
              <tubeGeometry args={[c, 48, 0.014, 8, false]} />
              <meshStandardMaterial color={WIRE_COLORS[i]} roughness={0.5} />
            </mesh>
            {[a, b].map((p, j) => (
              <mesh key={j} position={p}>
                <boxGeometry args={[0.07, 0.03, 0.03]} />
                <meshStandardMaterial color="#141516" roughness={0.6} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
});

/**
 * Open-top kit box. `flaps` receives the four lid flap groups so a parent can
 * animate them open. Flap order: front, back, left, right.
 */
export function KitBox({
  color,
  accent,
  flaps,
  ...props
}: G & { color: string; accent: string; flaps: React.RefObject<(THREE.Group | null)[]> }) {
  const W = 3.2;
  const H = 1.1;
  const D = 2.2;
  const T = 0.03;
  const mat = <meshStandardMaterial color={color} roughness={0.85} />;
  const inner = <meshStandardMaterial color={color} roughness={0.95} side={THREE.DoubleSide} />;
  const setFlap = (i: number) => (g: THREE.Group | null) => {
    if (flaps.current) flaps.current[i] = g;
  };
  return (
    <group {...props}>
      <mesh position={[0, T / 2, 0]} receiveShadow>
        <boxGeometry args={[W, T, D]} />
        {inner}
      </mesh>
      <mesh position={[0, H / 2, D / 2]} castShadow receiveShadow>
        <boxGeometry args={[W, H, T]} />
        {mat}
      </mesh>
      <mesh position={[0, H / 2, -D / 2]} castShadow receiveShadow>
        <boxGeometry args={[W, H, T]} />
        {mat}
      </mesh>
      <mesh position={[-W / 2, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[T, H, D]} />
        {mat}
      </mesh>
      <mesh position={[W / 2, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[T, H, D]} />
        {mat}
      </mesh>
      {/* brand stripe and dot on the front face */}
      <mesh position={[0, H * 0.55, D / 2 + T / 2 + 0.002]}>
        <planeGeometry args={[W * 0.7, 0.12]} />
        <meshStandardMaterial color={accent} roughness={0.5} />
      </mesh>
      <mesh position={[W * 0.39, H * 0.55, D / 2 + T / 2 + 0.003]}>
        <circleGeometry args={[0.07, 24]} />
        <meshStandardMaterial color="#e0233a" roughness={0.5} />
      </mesh>
      {/* flaps hinge on the top edges */}
      <group ref={setFlap(0)} position={[0, H, D / 2]}>
        <mesh position={[0, 0, -D / 4]} castShadow>
          <boxGeometry args={[W, T, D / 2]} />
          {mat}
        </mesh>
      </group>
      <group ref={setFlap(1)} position={[0, H, -D / 2]}>
        <mesh position={[0, 0, D / 4]} castShadow>
          <boxGeometry args={[W, T, D / 2]} />
          {mat}
        </mesh>
      </group>
      <group ref={setFlap(2)} position={[-W / 2, H, 0]}>
        <mesh position={[W / 4, 0.005, 0]} castShadow>
          <boxGeometry args={[W / 2, T, D * 0.98]} />
          {mat}
        </mesh>
      </group>
      <group ref={setFlap(3)} position={[W / 2, H, 0]}>
        <mesh position={[-W / 4, 0.005, 0]} castShadow>
          <boxGeometry args={[W / 2, T, D * 0.98]} />
          {mat}
        </mesh>
      </group>
    </group>
  );
}
