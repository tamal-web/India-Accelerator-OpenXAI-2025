"use client";
import { cn } from "@/lib/utils";
import { useEffect, useId, useRef } from "react";

type RoadmapStatus = "past" | "current" | "upcoming";

export type RoadmapItem = {
  title?: string;
  description?: string;
  date?: string;
  status?: RoadmapStatus;
};

export type RoadmapProps = {
  items: RoadmapItem[];
  ask: (input: string) => void;
  className?: string;
  bendOffset?: number;
  segmentHeight?: number;
  viewWidth?: number;
  topPadding?: number;
  labelOffsetPx?: number;
  // Animation controls
  animateGrowth?: boolean;
  growthDurationMs?: number;
  growthEasing?: string;
};

function generateAnchorPoints(
  count: number,
  {
    viewWidth = 800,
    topPadding = 60,
    segmentHeight = 180,
    bendOffset = 220,
  }: Required<
    Pick<
      RoadmapProps,
      "viewWidth" | "topPadding" | "segmentHeight" | "bendOffset"
    >
  >
) {
  const centerX = viewWidth / 2;
  const start = { x: centerX, y: topPadding };
  const points = [start];

  for (let i = 0; i < count; i++) {
    const isRight = i % 2 === 0;
    const x = centerX + (isRight ? bendOffset : -bendOffset);
    const y = topPadding + (i + 1) * segmentHeight;
    points.push({ x, y });
  }

  const viewHeight = topPadding + (count + 1) * segmentHeight;
  return { points, viewHeight, viewWidth };
}

function buildCurvyPath(points: Array<{ x: number; y: number }>) {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const midY = (p0.y + p1.y) / 2;
    const c1x = p0.x;
    const c1y = midY;
    const c2x = p1.x;
    const c2y = midY;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

function statusColorClasses(status?: RoadmapStatus) {
  // Colors used: blue-600 (primary), green-600 (accent for "past"),
  // neutrals: white, gray-300, gray-900
  switch (status) {
    case "past":
      return "text-green-600";
    case "current":
      return "text-blue-600";
    case "upcoming":
    default:
      return "text-gray-900";
  }
}

export function Roadmap({
  items,
  className,
  ask,
  bendOffset = 220,
  segmentHeight = 180,
  viewWidth = 800,
  topPadding = 60,
  labelOffsetPx = 12,
  // Animation defaults
  animateGrowth = true,
  growthDurationMs = 800,
  growthEasing = "cubic-bezier(0.22, 1, 0.36, 1)",
}: RoadmapProps) {
  const maskId = useId();

  const revealPathRef = useRef<SVGPathElement | null>(null);
  const prevTotalLengthRef = useRef<number | null>(null);
  const prevCountRef = useRef<number>(items?.length ?? 0);

  const itemsCount = items?.length ?? 0;

  const { points, viewHeight } = generateAnchorPoints(itemsCount, {
    viewWidth,
    topPadding,
    segmentHeight,
    bendOffset,
  });

  const pathD = buildCurvyPath(points);
  const contentPoints = points.slice(1); // one per item
  const toPct = (value: number, total: number) => `${(value / total) * 100}%`;

  useEffect(() => {
    const path = revealPathRef.current;
    if (!path) return;

    const newLen = path.getTotalLength();
    const grew = itemsCount > prevCountRef.current;

    if (!animateGrowth || !grew) {
      path.style.transition = "none";
      path.style.strokeDasharray = `${newLen}`;
      path.style.strokeDashoffset = "0";
      prevTotalLengthRef.current = newLen;
      prevCountRef.current = itemsCount;
      return;
    }

    const prevLen = prevTotalLengthRef.current ?? newLen;
    const startOffset = Math.max(0, newLen - prevLen);

    path.style.transition = "none";
    path.style.strokeDasharray = `${newLen}`;
    path.style.strokeDashoffset = `${startOffset}`;

    requestAnimationFrame(() => {
      path.style.transition = `stroke-dashoffset ${growthDurationMs}ms ${growthEasing}`;
      path.style.strokeDashoffset = "0";
    });

    prevTotalLengthRef.current = newLen;
    prevCountRef.current = itemsCount;
  }, [pathD, itemsCount, animateGrowth, growthDurationMs, growthEasing]);

  return (
    <section className={cn("w-full", className)} aria-label="Roadmap">
      <div className="relative w-full">
        {itemsCount === 0 ? (
          <div className="rounded-md border bg-card p-6 text-center text-sm text-muted-foreground">
            No roadmap items.
          </div>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${viewWidth} ${viewHeight}`}
              preserveAspectRatio="xMidYMid meet"
              className="h-auto w-full"
              role="img"
              aria-label="Curvy road with milestones"
            >
              <defs>
                <mask id={`reveal-${maskId}`}>
                  <rect width="100%" height="100%" fill="black" />
                  <path
                    ref={revealPathRef}
                    d={pathD}
                    stroke="white"
                    strokeWidth={220}
                    strokeLinecap="round"
                    fill="none"
                  />
                </mask>
              </defs>

              <g mask={`url(#reveal-${maskId})`}>
                {/* Road base */}
                <path
                  d={pathD}
                  className="text-gray-300"
                  stroke="currentColor"
                  strokeWidth={30}
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Center dashed line */}
                <path
                  d={pathD}
                  className="text-white dark:text-gray-100"
                  stroke="currentColor"
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeDasharray="12 12"
                  fill="none"
                />
                {/* Connectors + markers */}
                {contentPoints.map((p, i) => {
                  const isRight = i % 2 === 0;
                  const dir = isRight ? 1 : -1;
                  const connectorLen = 82;
                  const cx = p.x;
                  const cy = p.y;
                  const connectorPath = `M ${cx} ${cy} L ${
                    cx + dir * connectorLen
                  } ${cy}`;
                  const colorClass = statusColorClasses(items[i]?.status);
                  return (
                    <g key={`connector-${i}`} className={colorClass}>
                      <path
                        d={connectorPath}
                        stroke="currentColor"
                        strokeWidth={2}
                        fill="none"
                      />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={9}
                        fill="#ffffff"
                        stroke="currentColor"
                        strokeWidth={3}
                      />
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Overlay destination cards */}
            <div className="pointer-events-none absolute inset-0">
              {contentPoints.map((p, i) => {
                const item = items[i];
                const isRight = i % 2 === 0;
                const leftPct = toPct(p.x, viewWidth);
                const topPct = toPct(p.y, viewHeight);
                const grew = prevCountRef.current < itemsCount;
                const isNewest = grew && i === itemsCount - 1;

                return (
                  <div
                    key={`dest-${i}`}
                    className={cn(
                      "absolute pointer-events-auto",
                      isNewest &&
                        "animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out"
                    )}
                    style={{
                      left: leftPct,
                      top: topPct,
                      transform: `translate(${
                        isRight
                          ? `${connectorOffsetPx(82) + labelOffsetPx}px`
                          : `-${connectorOffsetPx(82) + labelOffsetPx}px`
                      }, -50%)`,
                    }}
                    aria-label={`Roadmap destination: ${item.title}`}
                  >
                    <RoadmapCard
                      ask={ask}
                      item={item}
                      align={isRight ? "right" : "left"}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function connectorOffsetPx(connectorLen: number) {
  // Since the overlay uses CSS pixels and the SVG scales responsively,
  // we offset cards by a fixed px amount to keep a consistent gap after the connector visually.
  // Here we simply return the connector length as px to roughly align; tweak as desired.
  return connectorLen;
}

function RoadmapCard({
  item,
  align,
  ask,
}: {
  item: RoadmapItem;
  align: "left" | "right";
  ask: (input: string) => void;
}) {
  const status = item.status;
  return (
    <div
      onClick={() => {
        console.log(item.title);
        if (item.title && item.description) {
          ask(item.title + ": " + item.description);
        }
      }}
      className={cn(
        "max-w-xs rounded-md border bg-card p-4 shadow-sm transform transition-all duration-[150] hover:scale-[1.05] cursor-pointer ",
        "transition-colors",
        align === "right" ? "text-left" : "text-right"
      )}
    >
      <div
        className={cn(
          "mb-1 flex items-start gap-2 ",
          align === "right" ? "justify-between" : "flex-row-reverse"
        )}
      >
        <h3 className="text-pretty font-sans text-base font-semibold text-foreground">
          {item.title}
        </h3>
        {status && (
          <span
            className={cn(
              "shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium",
              status === "past"
                ? "border-green-600 text-green-600"
                : status === "current"
                ? "border-blue-600 text-blue-600"
                : "border-gray-400 text-gray-600"
            )}
            aria-label={`Status: ${status}`}
          >
            {status}
          </span>
        )}
      </div>
      {item.date && (
        <p className="text-xs text-muted-foreground">{item.date}</p>
      )}
      {item.description && (
        <p className="mt-2 text-sm leading-relaxed text-foreground/80">
          {item.description}
        </p>
      )}
    </div>
  );
}
