import { useEffect, useMemo } from "react";

export type FxKind = "tornado" | "blackhole" | "supernova";

const LABELS: Record<FxKind, string> = {
  tornado: "NÍVEL 2 — MÉDIO",
  blackhole: "NÍVEL 3 — HARD",
  supernova: "VOCÊ VENCEU",
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function TransitionFx({ kind, onDone }: { kind: FxKind; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3800);
    return () => clearTimeout(t);
  }, [onDone]);

  const shards = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        id: i,
        left: rand(0, 100),
        top: rand(0, 100),
        s: rand(8, 46),
        d: rand(0, 1.1),
        hue: rand(-30, 30),
      })),
    [],
  );

  const bands = useMemo(() => Array.from({ length: 14 }, (_, i) => i), []);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{ perspective: "900px" }}>
      <div
        className="absolute inset-0 bg-background"
        style={{ animation: "fx-veil 3.8s ease-in-out forwards" }}
      />
      <div
        className="absolute inset-0"
        style={{
          animation:
            kind === "blackhole"
              ? "shake-hard 2.4s ease-in-out 0.6s 1, shake-screen 500ms ease-in-out 3s 2"
              : "shake-hard 1.6s ease-in-out 1s 2",
        }}
      >
        {kind === "tornado" && (
          <>
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 60% 90% at 50% 110%, color-mix(in oklab, var(--stage-glow) 40%, transparent), transparent 70%)",
                animation: "fx-fade-io 3.8s ease-in-out forwards",
              }}
            />
            {bands.map((b) => (
              <div
                key={b}
                className="absolute left-1/2 top-1/2 rounded-[50%] border-2"
                style={{
                  width: `${18 + b * 7}vw`,
                  height: `${6 + b * 1.2}vh`,
                  borderColor: "color-mix(in oklab, var(--stage-glow) 65%, transparent)",
                  filter: `blur(${1 + b * 0.35}px)`,
                  transformOrigin: "center",
                  animation: `funnel-band ${1.4 + b * 0.07}s linear ${b * 0.04}s infinite`,
                  ["--ty" as string]: `${-50 + (b - 7) * 9}vh`,
                }}
              />
            ))}
            <div
              className="absolute left-1/2 top-0 h-[130vh] w-[85vw] -translate-x-1/2"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent, color-mix(in oklab, var(--stage-glow) 75%, transparent), transparent 45%, color-mix(in oklab, var(--stage-glow) 45%, transparent), transparent 75%)",
                clipPath: "polygon(50% 100%, 4% 0%, 96% 0%)",
                filter: "blur(18px)",
                mixBlendMode: "screen",
                animation: "tornado-funnel 3.8s cubic-bezier(.4,0,.2,1) forwards",
              }}
            />
            {shards.map((s) => (
              <span
                key={s.id}
                className="absolute"
                style={
                  {
                    left: `${s.left}%`,
                    top: `${s.top}%`,
                    width: s.s,
                    height: s.s * 0.7,
                    borderRadius: 3,
                    background: "var(--stage-glow)",
                    boxShadow: "0 0 14px var(--stage-glow)",
                    opacity: 0,
                    "--dx": `${(50 - s.left) * 1.6}vw`,
                    "--dy": `${-70 - Math.random() * 60}vh`,
                    "--dr": `${900 + Math.random() * 1500}deg`,
                    animation: `debris-orbit ${2.2 + s.d}s cubic-bezier(.4,0,.35,1) ${s.d * 0.5}s forwards`,
                  } as React.CSSProperties
                }
              />
            ))}
          </>
        )}

        {kind === "blackhole" && (
          <>
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, transparent 8%, color-mix(in oklab, var(--stage-glow) 30%, transparent) 22%, transparent 60%)",
                animation: "lens-warp 3.8s cubic-bezier(.7,0,.3,1) forwards",
              }}
            />
            {shards.map((s) => (
              <span
                key={s.id}
                className="absolute"
                style={
                  {
                    left: `${s.left}%`,
                    top: `${s.top}%`,
                    width: s.s,
                    height: Math.max(3, s.s * 0.18),
                    borderRadius: 999,
                    background: "var(--stage-glow)",
                    boxShadow: "0 0 22px var(--stage-glow)",
                    "--px": `${s.left}vw`,
                    "--py": `${s.top}vh`,
                    animation: `spiral-in ${1.5 + s.d}s cubic-bezier(.55,0,.9,.25) ${s.d * 0.35}s forwards`,
                  } as React.CSSProperties
                }
              />
            ))}
            <div
              className="absolute left-1/2 top-1/2 h-[36vh] w-[36vh] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent, var(--stage-glow), transparent 40%, var(--stage-glow), transparent 80%)",
                filter: "blur(10px)",
                animation: "disk-spin 3.8s cubic-bezier(.6,0,.3,1) forwards",
              }}
            />
            <div
              className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black"
              style={{ animation: "hole-grow 3.8s cubic-bezier(.85,0,.15,1) forwards" }}
            />
            <div
              className="absolute inset-0 bg-white"
              style={{ animation: "flash-out 3.8s ease-out forwards" }}
            />
          </>
        )}

        {kind === "supernova" && (
          <>
            {[0, 0.2, 0.4, 0.65, 0.9].map((d) => (
              <div
                key={d}
                className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-4"
                style={{
                  borderColor: "var(--stage-glow)",
                  filter: "blur(1px)",
                  animation: `ring-blast 3s cubic-bezier(.15,.7,.2,1) ${d}s forwards`,
                }}
              />
            ))}
            {shards.map((s) => (
              <span
                key={s.id}
                className="absolute left-1/2 top-1/2 rounded-full"
                style={
                  {
                    width: Math.max(3, s.s * 0.25),
                    height: Math.max(3, s.s * 0.25),
                    background: "var(--stage-glow)",
                    boxShadow: "0 0 20px var(--stage-glow)",
                    "--dx": `${rand(-60, 60)}vw`,
                    "--dy": `${rand(-60, 60)}vh`,
                    "--dr": "0deg",
                    animation: `debris-orbit ${1.6 + s.d}s cubic-bezier(.1,.8,.2,1) ${s.d * 0.3}s forwards`,
                  } as React.CSSProperties
                }
              />
            ))}
            <div
              className="absolute inset-0"
              style={{
                background: "radial-gradient(circle, var(--stage-glow), transparent 60%)",
                mixBlendMode: "screen",
                animation: "nova-core 3.8s ease-out forwards",
              }}
            />
          </>
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <h2
          className="text-center text-4xl font-black uppercase tracking-[0.2em] text-foreground sm:text-6xl"
          style={{
            animation: "title-slam 3.8s cubic-bezier(.2,.8,.2,1) forwards",
            textShadow: "0 0 60px var(--stage-glow), 0 0 12px var(--stage-glow)",
          }}
        >
          {LABELS[kind]}
        </h2>
      </div>
    </div>
  );
}
