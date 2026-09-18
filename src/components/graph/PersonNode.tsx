"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animated, useSpring } from "@react-spring/three";
import { Billboard, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, Color, DoubleSide, SRGBColorSpace, type Material } from "three";
import type { NodeRendererProps } from "reagraph";
import { designTokens } from "@/lib/designTokens";
import { withBasePath } from "@/lib/basePath";
import { shade } from "@/lib/louvainColors";
import { initialsOf, type PersonNodeData } from "@/lib/graphData";

const SPRING = { mass: 1, tension: 220, friction: 24 };

const FACE_SIZE = 256;

/** The fallback face: initials on the community pastel. */
function drawInitials(canvas: HTMLCanvasElement, initials: string, pastel: string) {
  const size = canvas.width;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = pastel;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = shade(pastel, 0.72);
  ctx.font = `600 ${size * 0.4}px "Bricolage Grotesque", system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, size / 2, size / 2 + size * 0.02);
}

/** Cover-crops the photo into the round face, so portraits are cropped rather than squashed. */
function drawPhoto(canvas: HTMLCanvasElement, img: HTMLImageElement) {
  const size = canvas.width;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();
  const scale = Math.max(size / img.width, size / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
  ctx.restore();
}

/**
 * The node's face texture. Starts on the initials and swaps to the profile
 * photo once it decodes, so a slow or broken photo never leaves a blank dot.
 */
function useFaceTexture(initials: string, pastel: string, photoURL: string | null | undefined): CanvasTexture {
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!photoURL) return;
    let cancelled = false;
    const img = new Image();
    // Signed Supabase URLs are cross-origin; without this the canvas taints and WebGL rejects it.
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!cancelled) setPhoto(img);
    };
    img.src = photoURL;
    return () => {
      cancelled = true;
    };
  }, [photoURL]);

  // Derived, not mutated in place: a decoded photo simply produces a new
  // texture, so nothing here reaches back into a value React already handed out.
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = FACE_SIZE;
    canvas.height = FACE_SIZE;
    if (photo && photoURL) drawPhoto(canvas, photo);
    else drawInitials(canvas, initials, pastel);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }, [photo, photoURL, initials, pastel]);
}

/** Eases a material's opacity toward `target * factor` every frame. */
function useEasedOpacity(target: number) {
  const refs = useRef<{ mat: Material | null; factor: number }[]>([]);
  useFrame(() => {
    for (const { mat, factor } of refs.current) {
      if (!mat) continue;
      const goal = target * factor;
      const next = mat.opacity + (goal - mat.opacity) * 0.18;
      mat.opacity = Math.abs(goal - next) < 0.002 ? goal : next;
    }
  });
  return (factor: number) => (mat: Material | null) => {
    const i = refs.current.findIndex((r) => r.factor === factor);
    if (i >= 0) refs.current[i].mat = mat;
    else refs.current.push({ mat, factor });
  };
}

/**
 * Custom reagraph node: a matte pastel sphere with a soft shadow disc behind
 * it, a billboarded initials face, and an ink ring while hovered. `color` from
 * reagraph is ignored on purpose so a hovered node keeps its community pastel.
 */
/** World-unit font size for name labels. Fixed, so big and small dots get the same text. */
const LABEL_SIZE = 13;

export function PersonNode({
  node,
  size,
  active,
  opacity,
  animated: isAnimated,
  photoURL,
}: NodeRendererProps & { photoURL?: string | null }) {
  const data = node.data as PersonNodeData | undefined;
  const pastel = node.fill ?? designTokens.pastels[0];
  const initials = useMemo(() => initialsOf(data?.name ?? node.label ?? "?"), [data?.name, node.label]);
  const faceTexture = useFaceTexture(initials, pastel, photoURL);
  const sphereColor = useMemo(() => new Color(pastel), [pastel]);
  const rimColor = useMemo(() => new Color(shade(pastel, 0.35)), [pastel]);
  const inkColor = useMemo(() => new Color(designTokens.ink), []);
  const shadowColor = useMemo(() => new Color(shade(designTokens.bgMuted, 0.55)), []);
  const bind = useEasedOpacity(opacity);

  const { scale } = useSpring({
    from: { scale: 0.001 },
    to: { scale: active ? size * 1.12 : size },
    config: { ...SPRING, duration: isAnimated ? undefined : 0 },
  });

  return (
    <>
      {/* name, sitting under the dot, always facing the camera. Not scaled with the node. */}
      <Billboard follow>
        <Text
          position={[0, -(size + LABEL_SIZE * 0.55), 0.5]}
          font={withBasePath("/fonts/BricolageGrotesque.ttf")}
          fontSize={LABEL_SIZE}
          color={designTokens.ink}
          anchorX="center"
          anchorY="top"
          outlineWidth={LABEL_SIZE * 0.14}
          outlineColor={designTokens.bg}
          outlineOpacity={0.9}
          fillOpacity={opacity}
          raycast={() => null}
        >
          {data?.name ?? node.label ?? ""}
        </Text>
      </Billboard>
    <animated.group scale={scale}>
      {/* soft drop shadow: a translucent disc behind and just below the sphere, always facing the camera */}
      <Billboard follow>
        <mesh position={[0.22, -0.34, -0.9]} raycast={() => null}>
          <circleGeometry args={[1.18, 40]} />
          <meshBasicMaterial ref={bind(0.14)} color={shadowColor} transparent opacity={0} depthWrite={false} fog />
        </mesh>
      </Billboard>

      {/* the dot itself */}
      <mesh userData={{ id: node.id, type: "node" }}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          ref={bind(1)}
          color={sphereColor}
          emissive={rimColor}
          emissiveIntensity={0.08}
          roughness={0.85}
          metalness={0}
          transparent
          opacity={0}
          fog
        />
      </mesh>

      {/* initials face, always turned toward the camera */}
      <Billboard follow>
        <mesh position={[0, 0, 1.02]} raycast={() => null}>
          <circleGeometry args={[0.78, 40]} />
          <meshBasicMaterial ref={bind(0.999)} map={faceTexture} transparent opacity={0} depthWrite={false} fog />
        </mesh>
        {active && (
          <mesh position={[0, 0, 1.03]} raycast={() => null}>
            <ringGeometry args={[1.08, 1.2, 48]} />
            <meshBasicMaterial color={inkColor} side={DoubleSide} transparent opacity={0.9} depthWrite={false} />
          </mesh>
        )}
      </Billboard>
    </animated.group>
    </>
  );
}
