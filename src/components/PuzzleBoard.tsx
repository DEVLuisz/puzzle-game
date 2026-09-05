import { useEffect, useId, useMemo, useRef, useState } from "react";

type Props = {
  image: string;
  cols: number;
  rows: number;
  /** slot -> peça encaixada (ou null). */
  board: (number | null)[];
  /** peças ainda na bandeja, fora do quadro. */
  tray: number[];
  onPlace: (piece: number, slot: number) => void;
  onReturn: (piece: number) => void;
  preview: boolean;
};

/** Direção das abas: +1 aba para fora, -1 encaixe para dentro, 0 borda reta. */
function edgeSigns(cols: number, rows: number, seed: number) {
  let s = seed * 9301 + 49297;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const h: number[][] = [];
  const v: number[][] = [];
  for (let r = 0; r < rows - 1; r++)
    h.push(Array.from({ length: cols }, () => (rnd() > 0.5 ? 1 : -1)));
  for (let r = 0; r < rows; r++)
    v.push(Array.from({ length: cols - 1 }, () => (rnd() > 0.5 ? 1 : -1)));
  return { h, v };
}

type Pt = [number, number];

function mapper(side: 0 | 1 | 2 | 3) {
  return ([p, o]: Pt): Pt => {
    if (side === 0) return [p, -o];
    if (side === 1) return [1 + o, p];
    if (side === 2) return [1 - p, 1 + o];
    return [-o, 1 - p];
  };
}

const fmt = ([x, y]: Pt) => `${x.toFixed(4)} ${y.toFixed(4)}`;

function edgePath(side: 0 | 1 | 2 | 3, tab: number) {
  const m = mapper(side);
  if (tab === 0) return `L ${fmt(m([1, 0]))}`;
  const t = tab;
  const seg = (a: Pt, b: Pt, c: Pt) => `C ${fmt(m(a))}, ${fmt(m(b))}, ${fmt(m(c))}`;
  return [
    `L ${fmt(m([0.44, 0]))}`,
    seg([0.39, 0.04 * t], [0.36, 0.15 * t], [0.5, 0.15 * t]),
    seg([0.64, 0.15 * t], [0.61, 0.04 * t], [0.56, 0]),
    `L ${fmt(m([1, 0]))}`,
  ].join(" ");
}

function piecePath(piece: number, cols: number, rows: number, signs: ReturnType<typeof edgeSigns>) {
  const r = Math.floor(piece / cols);
  const c = piece % cols;
  const top = r === 0 ? 0 : -signs.h[r - 1]![c]!;
  const bottom = r === rows - 1 ? 0 : signs.h[r]![c]!;
  const left = c === 0 ? 0 : -signs.v[r]![c - 1]!;
  const right = c === cols - 1 ? 0 : signs.v[r]![c]!;
  return [
    "M 0 0",
    edgePath(0, top),
    edgePath(1, right),
    edgePath(2, bottom),
    edgePath(3, left),
    "Z",
  ].join(" ");
}

export function PuzzleBoard({ image, cols, rows, board, tray, onPlace, onReturn, preview }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [reject] = useState<number | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [aspect, setAspect] = useState(1);
  const cellRef = useRef<HTMLDivElement>(null);

  const signs = useMemo(() => edgeSigns(cols, rows, cols * 31 + rows * 7 + 3), [cols, rows]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setAspect(img.naturalWidth / img.naturalHeight);
    img.src = image;
  }, [image]);

  const cover = useMemo(() => {
    const boardAspect = cols / rows;
    if (aspect >= boardAspect) {
      const w = rows * aspect;
      return { w, h: rows, x: -(w - cols) / 2, y: 0 };
    }
    const h = cols / aspect;
    return { w: cols, h, x: 0, y: -(h - rows) / 2 };
  }, [aspect, cols, rows]);

  const slotFromPoint = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const holder = el?.closest("[data-slot]") as HTMLElement | null;
    if (!holder) return null;
    const n = Number(holder.dataset["slot"]);
    return Number.isNaN(n) ? null : n;
  };

  const startDrag = (
    piece: number,
    fromSlot: number | null,
    e: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (preview) return;
    const cell = cellRef.current?.getBoundingClientRect();
    const w = cell?.width ?? 60;
    const h = cell?.height ?? 60;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setDragging(piece);
    setGhost({ x: e.clientX, y: e.clientY, w, h });

    const move = (ev: PointerEvent) => {
      setGhost({ x: ev.clientX, y: ev.clientY, w, h });
      setOver(slotFromPoint(ev.clientX, ev.clientY));
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const target = slotFromPoint(ev.clientX, ev.clientY);
      setDragging(null);
      setOver(null);
      setGhost(null);
      if (target === null) {
        if (fromSlot !== null) onReturn(piece);
        return;
      }
      if (target === fromSlot) return;
      onPlace(piece, target);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const renderPiece = (piece: number, keySuffix: string, highlight: boolean) => {
    const row = Math.floor(piece / cols);
    const col = piece % cols;
    const clipId = `clip-${uid}-${keySuffix}-${piece}`;
    return (
      <svg
        viewBox="-0.5 -0.5 2 2"
        className="pointer-events-none absolute"
        style={{ left: "-50%", top: "-50%", width: "200%", height: "200%", overflow: "visible" }}
      >
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <path d={piecePath(piece, cols, rows, signs)} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <image
            href={image}
            x={cover.x - col}
            y={cover.y - row}
            width={cover.w}
            height={cover.h}
            preserveAspectRatio="none"
          />
        </g>
        <path
          d={piecePath(piece, cols, rows, signs)}
          fill="none"
          stroke={highlight ? "var(--stage-glow)" : "oklch(0 0 0 / 45%)"}
          strokeWidth={highlight ? 2 : 1}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  };

  const buckets: number[][] = [[], [], []];
  tray.forEach((p, i) => buckets[i % 3]!.push(p));

  const scatter = (pieces: number[], className: string) => (
    <div className={className}>
      {pieces.map((piece) => (
        <div
          key={piece}
          role="button"
          tabIndex={0}
          aria-label={`Peça ${piece + 1}`}
          onPointerDown={(e) => startDrag(piece, null, e)}
          className="relative h-[clamp(42px,7vh,74px)] w-[clamp(42px,7vh,74px)] shrink-0 cursor-grab touch-none select-none active:cursor-grabbing"
          style={{ opacity: dragging === piece ? 0.25 : 1 }}
        >
          {renderPiece(piece, "t", false)}
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex w-full flex-1 flex-col items-center gap-4">
      <div className="flex w-full items-start justify-center gap-3">
        {scatter(
          buckets[0]!,
          "hidden w-[clamp(96px,14vw,190px)] shrink-0 flex-wrap content-start justify-center gap-2 md:flex",
        )}

        <div
  className="relative rounded-xl p-[6px]"
  style={{
    aspectRatio: `${cols} / ${rows}`,
    maxWidth: "min(92vw, 1100px)",
    width: `min(100%, 1100px, calc(70vh * ${cols} / ${rows}))`,
    boxShadow: "var(--shadow-stage)",
    background: "color-mix(in oklab, var(--stage) 55%, transparent)",
  }}
>

          <div
            className="grid h-full w-full touch-none"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {board.map((piece, slot) => {
              const isOver = over === slot && dragging !== null;
              const isReject = reject === slot;
              return (
                <div
                  key={slot}
                  ref={slot === 0 ? cellRef : undefined}
                  data-slot={slot}
                  onPointerDown={(e) => piece !== null && startDrag(piece, slot, e)}
                  className={`relative touch-none select-none ${piece !== null ? "cursor-grab active:cursor-grabbing" : ""}`}
                  style={{
                    outline: isOver ? "1px solid var(--stage-glow)" : "1px solid oklch(1 0 0 / 6%)",
                    outlineOffset: "-1px",
                    background: piece === null ? "oklch(0 0 0 / 25%)" : "transparent",
                    animation: isReject ? "shake 300ms ease-out" : undefined,
                    zIndex: piece === null ? 1 : 2,
                    opacity: dragging === piece ? 0.25 : 1,
                  }}
                >
                  {piece !== null && renderPiece(piece, "b", false)}
                </div>
              );
            })}
          </div>

          {preview && (
            <img
              src={image}
              alt="Imagem completa do quebra-cabeça"
              className="pointer-events-none absolute inset-1.5 z-30 h-[calc(100%-12px)] w-[calc(100%-12px)] rounded-lg object-cover opacity-95"
            />
          )}
        </div>

        {scatter(
          buckets[1]!,
          "hidden w-[clamp(96px,14vw,190px)] shrink-0 flex-wrap content-start justify-center gap-2 md:flex",
        )}
      </div>

      {tray.length === 0 ? (
        <p className="px-2 text-xs text-muted-foreground">Todas as peças foram encaixadas.</p>
      ) : (
        scatter(
          buckets[2]!.concat(
            // em telas pequenas todas as peças ficam embaixo
            [],
          ),
          "flex w-[min(92vw,1100px)] flex-wrap justify-center gap-2 pb-6",
        )
      )}

      <div className="flex w-[min(92vw,1100px)] flex-wrap justify-center gap-2 pb-8 md:hidden">
        {buckets[0]!.concat(buckets[1]!).map((piece) => (
          <div
            key={piece}
            role="button"
            tabIndex={0}
            aria-label={`Peça ${piece + 1}`}
            onPointerDown={(e) => startDrag(piece, null, e)}
            className="relative h-[clamp(42px,7vh,74px)] w-[clamp(42px,7vh,74px)] shrink-0 cursor-grab touch-none select-none active:cursor-grabbing"
            style={{ opacity: dragging === piece ? 0.25 : 1 }}
          >
            {renderPiece(piece, "t", false)}
          </div>
        ))}
      </div>

      {ghost && dragging !== null && (
        <div
          className="pointer-events-none fixed z-50"
          style={{
            left: ghost.x,
            top: ghost.y,
            width: ghost.w,
            height: ghost.h,
            transform: "translate(-50%, -50%) scale(1.15)",
            filter:
              "drop-shadow(0 12px 22px oklch(0 0 0 / 55%)) drop-shadow(0 0 14px var(--stage-glow))",
          }}
        >
          <div className="relative h-full w-full">{renderPiece(dragging, "g", true)}</div>
        </div>
      )}
    </div>
  );
}
