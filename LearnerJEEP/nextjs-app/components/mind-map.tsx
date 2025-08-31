"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

type MindMapSubNode = {
  title: string;
  description?: string;
};

type MindMapNode = {
  title: string;
  description?: string;
  sub_nodes?: MindMapSubNode[];
  // Accept either sub_nodes or sub_node (lenient to user data)
  sub_node?: MindMapSubNode[];
};

type MindMapGroup = {
  nodes: MindMapNode[];
  // optional explicit side override
  side?: "top" | "right" | "bottom" | "left";
};

export type MindMapData = {
  title?: string;
  description?: string;
  // NEW grouped structure (preferred)
  group?: MindMapGroup[];
  // Back-compat: if provided, we'll split across four sides
  nodes?: MindMapNode[];
};

const NODE_WIDTHS = {
  center: 256, // w-64
  primary: 192, // w-48
  child: 160, // w-40
};
const GAP = {
  centerPrimary: 24,
  primaryNeighbors: 24,
  parentChild: 16,
  childNeighbors: 16,
};
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleRad: number
): { x: number; y: number } {
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const observer = new ResizeObserver(([entry]) => {
      const cr = entry.contentRect;
      setSize({ width: cr.width, height: cr.height });
    });
    observer.observe(el);
    // Initialize immediately
    const rect = el.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });
    return () => observer.disconnect();
  }, []);

  return { ref, size };
}

export function MindMap({
  data,
  className,
  nodeRadius = 160,
  childRadius = 80,
}: {
  data: MindMapData;
  className?: string;
  // distance props no longer drive positioning, kept for back-compat (ignored)
  nodeRadius?: number;
  childRadius?: number;
}) {
  // Colors used (5 total):
  // Primary: sky-600 (connectors)
  // Accent: emerald-500 (child connectors)
  // Neutrals: white, gray-200, gray-700
  const { ref, size } = useElementSize<HTMLDivElement>();
  const center = { x: size.width / 2, y: size.height / 2 };

  // Constants for layout (approx heights to guarantee spacing)
  const CENTER_W = NODE_WIDTHS.center;
  const CENTER_H = 140;
  const PRIMARY_W = NODE_WIDTHS.primary;
  const PRIMARY_H = 96;
  const CHILD_W = NODE_WIDTHS.child;
  const CHILD_H = 84;

  // Normalize groups -> sides
  const sides = useMemo(() => {
    const order: Array<"top" | "right" | "bottom" | "left"> = [
      "top",
      "right",
      "bottom",
      "left",
    ];
    const result: Record<"top" | "right" | "bottom" | "left", MindMapNode[]> = {
      top: [],
      right: [],
      bottom: [],
      left: [],
    };

    if (data.group && Array.isArray(data.group) && data.group.length > 0) {
      data.group.slice(0, 4).forEach((g, idx) => {
        const side = g.side ?? order[idx];
        result[side] = g.nodes ?? [];
      });
    } else {
      // Backwards compatibility: split nodes across 4 sides evenly
      const nodes = data.nodes ?? [];
      const chunkSize = Math.ceil(nodes.length / 4) || 0;
      result.top = nodes.slice(0, chunkSize);
      result.right = nodes.slice(chunkSize, chunkSize * 2);
      result.bottom = nodes.slice(chunkSize * 2, chunkSize * 3);
      result.left = nodes.slice(chunkSize * 3);
    }

    return result;
  }, [data]);

  // Compute positions for primary nodes per side (no overlaps by construction)
  const positions = useMemo(() => {
    const gapMain = GAP.centerPrimary;
    const gapBetween = GAP.primaryNeighbors;

    // Anchors just outside the center card on each side
    const leftX = center.x - (CENTER_W / 2 + gapMain + PRIMARY_W / 2);
    const rightX = center.x + (CENTER_W / 2 + gapMain + PRIMARY_W / 2);
    const topY = center.y - (CENTER_H / 2 + gapMain + PRIMARY_H / 2);
    const bottomY = center.y + (CENTER_H / 2 + gapMain + PRIMARY_H / 2);

    // Helpers to stack items with equal gaps
    const stackVertical = (
      count: number,
      centerY: number,
      itemH: number,
      gap: number
    ) => {
      if (count <= 0) return [] as number[];
      const total = count * itemH + (count - 1) * gap;
      const start = centerY - total / 2 + itemH / 2;
      return Array.from({ length: count }, (_, i) => start + i * (itemH + gap));
    };
    const stackHorizontal = (
      count: number,
      centerX: number,
      itemW: number,
      gap: number
    ) => {
      if (count <= 0) return [] as number[];
      const total = count * itemW + (count - 1) * gap;
      const start = centerX - total / 2 + itemW / 2;
      return Array.from({ length: count }, (_, i) => start + i * (itemW + gap));
    };

    const topNodes = sides.top;
    const rightNodes = sides.right;
    const bottomNodes = sides.bottom;
    const leftNodes = sides.left;

    // Primary positions
    const topXs = stackHorizontal(
      topNodes.length,
      center.x,
      PRIMARY_W,
      gapBetween
    );
    const bottomXs = stackHorizontal(
      bottomNodes.length,
      center.x,
      PRIMARY_W,
      gapBetween
    );
    const leftYs = stackVertical(
      leftNodes.length,
      center.y,
      PRIMARY_H,
      gapBetween
    );
    const rightYs = stackVertical(
      rightNodes.length,
      center.y,
      PRIMARY_H,
      gapBetween
    );

    const primaryPositions: Array<{
      key: string;
      node: MindMapNode;
      pos: { x: number; y: number };
      side: "top" | "right" | "bottom" | "left";
      index: number;
    }> = [];

    topNodes.forEach((node, i) =>
      primaryPositions.push({
        key: `top-${i}`,
        node,
        pos: { x: topXs[i], y: topY },
        side: "top",
        index: i,
      })
    );
    rightNodes.forEach((node, i) =>
      primaryPositions.push({
        key: `right-${i}`,
        node,
        pos: { x: rightX, y: rightYs[i] },
        side: "right",
        index: i,
      })
    );
    bottomNodes.forEach((node, i) =>
      primaryPositions.push({
        key: `bottom-${i}`,
        node,
        pos: { x: bottomXs[i], y: bottomY },
        side: "bottom",
        index: i,
      })
    );
    leftNodes.forEach((node, i) =>
      primaryPositions.push({
        key: `left-${i}`,
        node,
        pos: { x: leftX, y: leftYs[i] },
        side: "left",
        index: i,
      })
    );

    // Child positions: placed away from the center relative to their parent
    const childPositions: Record<
      string,
      Array<{
        childIndex: number;
        child: MindMapSubNode;
        pos: { x: number; y: number };
      }>
    > = {};

    const childGap = GAP.childNeighbors;
    const parentChildGap = GAP.parentChild;

    function placeChildren(
      parentKey: string,
      side: "top" | "right" | "bottom" | "left",
      parentPos: { x: number; y: number },
      subs: MindMapSubNode[]
    ) {
      if (!subs || subs.length === 0) {
        childPositions[parentKey] = [];
        return;
      }

      let anchorX = parentPos.x;
      let anchorY = parentPos.y;
      let stack: number[] = [];

      if (side === "left") {
        anchorX = parentPos.x - (PRIMARY_W / 2 + parentChildGap + CHILD_W / 2);
        stack = stackVertical(subs.length, parentPos.y, CHILD_H, childGap);
        childPositions[parentKey] = stack.map((y, j) => ({
          childIndex: j,
          child: subs[j],
          pos: { x: anchorX, y },
        }));
      } else if (side === "right") {
        anchorX = parentPos.x + (PRIMARY_W / 2 + parentChildGap + CHILD_W / 2);
        stack = stackVertical(subs.length, parentPos.y, CHILD_H, childGap);
        childPositions[parentKey] = stack.map((y, j) => ({
          childIndex: j,
          child: subs[j],
          pos: { x: anchorX, y },
        }));
      } else if (side === "top") {
        anchorY = parentPos.y - (PRIMARY_H / 2 + parentChildGap + CHILD_H / 2);
        stack = stackHorizontal(subs.length, parentPos.x, CHILD_W, childGap);
        childPositions[parentKey] = stack.map((x, j) => ({
          childIndex: j,
          child: subs[j],
          pos: { x, y: anchorY },
        }));
      } else {
        // bottom
        anchorY = parentPos.y + (PRIMARY_H / 2 + parentChildGap + CHILD_H / 2);
        stack = stackHorizontal(subs.length, parentPos.x, CHILD_W, childGap);
        childPositions[parentKey] = stack.map((x, j) => ({
          childIndex: j,
          child: subs[j],
          pos: { x, y: anchorY },
        }));
      }
    }

    for (const p of primaryPositions) {
      const subs = (p.node.sub_nodes ??
        p.node.sub_node ??
        []) as MindMapSubNode[];
      placeChildren(p.key, p.side, p.pos, subs);
    }

    return { primaryPositions, childPositions, CENTER_W, CENTER_H };
  }, [sides, center.x, center.y]);

  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full h-[600px] rounded-md border border-gray-200 bg-white overflow-hidden",
        className
      )}
      role="group"
      aria-label={`Mind map for ${data.title}`}
    >
      {/* Connectors */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={size.width}
        height={size.height}
        viewBox={`0 0 ${size.width} ${size.height}`}
        aria-hidden="true"
      >
        {/* Lines from center to primary nodes */}
        {positions.primaryPositions.map(({ pos, key }) => {
          const cp: { x: number; y: number } = {
            x: (center.x + pos.x) / 2,
            y: (center.y + pos.y) / 2 - 30,
          };
          const d = `M ${center.x},${center.y} Q ${cp.x},${cp.y} ${pos.x},${pos.y}`;
          return (
            <path
              key={`link-center-${key}`}
              d={d}
              fill="none"
              stroke="rgb(2 132 199)" // sky-600
              strokeWidth={2}
              className="opacity-90"
            />
          );
        })}

        {/* Lines from primary nodes to their sub-nodes */}
        {positions.primaryPositions.map(({ pos, key }) =>
          positions.childPositions[key]?.map(({ pos: cpos }, j) => {
            const cp: { x: number; y: number } = {
              x: (pos.x + cpos.x) / 2,
              y: (pos.y + cpos.y) / 2 - 20,
            };
            const d = `M ${pos.x},${pos.y} Q ${cp.x},${cp.y} ${cpos.x},${cpos.y}`;
            return (
              <path
                key={`link-child-${key}-${j}`}
                d={d}
                fill="none"
                stroke="rgb(16 185 129)" // emerald-500
                strokeWidth={1.75}
                className="opacity-80"
              />
            );
          })
        )}
      </svg>

      {/* Center node */}
      <NodeCard
        title={data.title}
        description={data.description}
        x={center.x}
        y={center.y}
        variant="center"
      />

      {/* Primary nodes */}
      {positions.primaryPositions.map(({ key, node, pos }) => (
        <NodeCard
          key={`node-${key}`}
          title={node.title}
          description={node.description}
          x={pos.x}
          y={pos.y}
          variant="primary"
        />
      ))}

      {/* Sub-nodes */}
      {positions.primaryPositions.map(({ key, node }) => {
        const subs = (node?.sub_nodes ??
          node?.sub_node ??
          []) as MindMapSubNode[];
        return positions.childPositions[key]?.map(
          ({ childIndex, child, pos }) => (
            <NodeCard
              key={`sub-${key}-${childIndex}`}
              title={child.title}
              description={child.description}
              x={pos.x}
              y={pos.y}
              variant="child"
            />
          )
        );
      })}
    </div>
  );
}

function NodeCard({
  title,
  description,
  x,
  y,
  variant,
}: {
  title: string;
  description?: string;
  x: number;
  y: number;
  variant: "center" | "primary" | "child";
}) {
  const base = "absolute -translate-x-1/2 -translate-y-1/2";
  const width =
    variant === "center" ? "w-64" : variant === "primary" ? "w-48" : "w-40";
  const ring =
    variant === "center"
      ? "ring-2 ring-sky-600"
      : variant === "primary"
      ? "ring-1 ring-gray-200"
      : "ring-1 ring-emerald-500";

  const titleSize = variant === "center" ? "text-lg" : "text-base";

  return (
    <div
      className={cn(base)}
      style={{ left: x, top: y }}
      aria-label={`${
        variant === "center"
          ? "Center topic"
          : variant === "primary"
          ? "Subtopic"
          : "Detail"
      }: ${title}`}
    >
      <Card
        className={cn(
          width,
          ring,
          "bg-white shadow-sm hover:shadow transition-shadow px-4 py-3"
        )}
      >
        <CardHeader className="p-[0rem]">
          <CardTitle className={cn("text-balance", titleSize)}>
            {title}
          </CardTitle>
          {variant !== "center" && description ? (
            <CardDescription className="text-pretty">
              {description}
            </CardDescription>
          ) : null}
        </CardHeader>
        {variant === "center" && description ? (
          <CardContent className="pt-0">
            <p className="text-sm text-gray-700">{description}</p>
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}

export default MindMap;
