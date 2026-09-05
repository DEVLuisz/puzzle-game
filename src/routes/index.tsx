import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PuzzleBoard } from "@/components/PuzzleBoard";
import { TransitionFx, type FxKind } from "@/components/TransitionFx";
import level1Asset from "@/assets/level-1.png.asset.json";
import level2Asset from "@/assets/level-2.png.asset.json";
import level3Asset from "@/assets/level-3.png.asset.json";

const level1 = level1Asset.url;
const level2 = level2Asset.url;
const level3 = level3Asset.url;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quebra Cabeça" },
      {
        name: "description",
        content:
          "Três níveis de quebra-cabeça contra o relógio",
      },
      { property: "og:title", content: "Quebra Cabeça" },
      {
        property: "og:description",
        content: "Monte três imagens, cada nível mais difícil e com menos tempo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PuzzleGame,
});

type Level = {
  name: string;
  difficulty: string;
  image: string;
  cols: number;
  rows: number;
  seconds: number;
  theme: string;
};

/** Ative/desative o botão "Espiar" aqui (false = o botão some da tela). */
const SHOW_PEEK_BUTTON = true;

const LEVELS: Level[] = [
  { name: "Spirit", difficulty: "GG Easy", image: level1, cols: 8, rows: 5, seconds: 300, theme: "1" },
  { name: "Mikaela", difficulty: "Médio", image: level2, cols: 10, rows: 6, seconds: 360, theme: "2" },
  { name: "Lana del Rey", difficulty: "Hard", image: level3, cols: 10, rows: 8, seconds: 480, theme: "3" },
];

function shuffled(n: number) {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

type Phase = "intro" | "playing" | "transition" | "lost" | "won";

function PuzzleGame() {
  const [levelIndex, setLevelIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [board, setBoard] = useState<(number | null)[]>([]);
  const [tray, setTray] = useState<number[]>([]);
  
  const [time, setTime] = useState(LEVELS[0]!.seconds);
  const [moves, setMoves] = useState(0);
  const [peek, setPeek] = useState(false);
  const [fx, setFx] = useState<FxKind | null>(null);
  const nextLevel = useRef(0);

  const level = LEVELS[levelIndex]!;

  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.style.setProperty("--stage", `var(--stage-${level.theme})`);
    document.documentElement.style.setProperty("--stage-glow", `var(--stage-${level.theme}-glow)`);
  }, [level.theme]);

  const start = useCallback((index: number) => {
    const lv = LEVELS[index]!;
    setLevelIndex(index);
    const total = lv.cols * lv.rows;
    setBoard(Array.from({ length: total }, () => null));
    setTray(shuffled(total));
    
    setMoves(0);
    setTime(lv.seconds);
    setPeek(false);
    setPhase("playing");
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          clearInterval(id);
          setPhase("lost");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const place = (piece: number, slot: number) => {
    if (phase !== "playing") return;
    const next = [...board];
    const from = next.indexOf(piece);
    const displaced = next[slot] ?? null;
    if (from !== -1) next[from] = displaced;
    next[slot] = piece;
    setBoard(next);
    setMoves((m) => m + 1);
    setTray((t) => {
      let out = t.filter((p) => p !== piece);
      if (from === -1 && displaced !== null) out = [...out, displaced];
      return out;
    });

    if (next.every((v, i) => v === i)) {
      const isLast = levelIndex === LEVELS.length - 1;
      nextLevel.current = isLast ? levelIndex : levelIndex + 1;
      setFx(isLast ? "supernova" : levelIndex === 0 ? "tornado" : "blackhole");
      setPhase("transition");
    }
  };

  const returnPiece = (piece: number) => {
    if (phase !== "playing") return;
    const idx = board.indexOf(piece);
    if (idx === -1) return;
    const next = [...board];
    next[idx] = null;
    setBoard(next);
    setTray((t) => (t.includes(piece) ? t : [...t, piece]));
  };


  const finishFx = useCallback(() => {
    const wasLast = fx === "supernova";
    setFx(null);
    if (wasLast) setPhase("won");
    else start(nextLevel.current);
  }, [fx, start]);

  const urgency = time <= 10;
  const clock = useMemo(
    () => `${String(Math.floor(time / 60)).padStart(2, "0")}:${String(time % 60).padStart(2, "0")}`,
    [time],
  );

  return (
    <main
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden"
      style={{ background: "radial-gradient(circle at 60% 40%, var(--stage-glow), transparent 100%)"}}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(circle at 50% 50%, var(--stage-glow), transparent 60%)",
          opacity: 0.12,
          animation: "stage-pulse 6s ease-in-out infinite",
        }}
      />

      {phase === "playing" && (
        <div className="z-10 flex min-h-screen w-full flex-col items-center gap-2 px-3 py-3">
          <header className="flex w-[min(92vw,1100px)] shrink-0 items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
                Nível {levelIndex + 1} · {level.difficulty}
              </p>
              <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-2xl">
                {level.name}
              </h1>
            </div>
            <div className="text-right">
              <p
                className="font-mono text-2xl font-bold tabular-nums sm:text-4xl"
                style={{
                  color: urgency ? "var(--stage-glow)" : "var(--foreground)",
                  textShadow: urgency ? "0 0 24px var(--stage-glow)" : "none",
                }}
              >
                {clock}
              </p>
              <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                {tray.length} peças restantes · {level.cols * level.rows} no total
              </p>
            </div>
          </header>

          <PuzzleBoard
            image={level.image}
            cols={level.cols}
            rows={level.rows}
            board={board}
            tray={tray}
            onPlace={place}
            onReturn={returnPiece}
            preview={peek}
          />

          <footer className="flex w-[min(92vw,1100px)] shrink-0 items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Arraste as peças para qualquer espaço, troque à vontade — o nível só avança com tudo no lugar certo · {moves} movimentos
            </p>
            <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => start(levelIndex)}
              className="rounded-full border border-border px-4 py-1.5 text-xs uppercase tracking-widest text-foreground transition-colors hover:bg-accent"
            >
              Reiniciar
            </button>
            {SHOW_PEEK_BUTTON && (
              <button
                type="button"
                onMouseDown={() => setPeek(true)}
                onMouseUp={() => setPeek(false)}
                onMouseLeave={() => setPeek(false)}
                onTouchStart={() => setPeek(true)}
                onTouchEnd={() => setPeek(false)}
                className="rounded-full border border-border px-4 py-1.5 text-xs uppercase tracking-widest text-foreground transition-colors hover:bg-accent"
              >
                Espiar
              </button>
            )}
            </div>
          </footer>
        </div>
      )}

      {(phase === "intro" || phase === "lost") && (
        <div className="z-10 flex max-w-lg flex-col items-center px-6 text-center">
          <p className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground">
            {phase === "intro" ? "Três atos, um enigma" : "O tempo venceu"}
          </p>
          <h1
            className="mt-3 text-4xl font-black uppercase tracking-tight text-foreground sm:text-6xl"
            style={{ textShadow: "0 0 50px var(--stage-glow)" }}
          >
            {phase === "intro" ? "Enigma em 3 Atos" : "Tempo esgotado"}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground sm:text-base">
            {phase === "intro"
              ? "Três quadros, três dificuldades e um relógio cada vez mais curto."
              : `Você ficou no nível ${levelIndex + 1} (${level.difficulty}). Tente de novo.`}
          </p>
          <button
            type="button"
            onClick={() => start(phase === "lost" ? levelIndex : 0)}
            className="mt-8 rounded-full px-8 py-3 text-sm font-bold uppercase tracking-[0.25em] text-foreground transition-transform hover:scale-105"
            style={{ background: "var(--stage-glow)", color: "oklch(0.12 0.02 270)", boxShadow: "var(--shadow-stage)" }}
          >
            {phase === "intro" ? "Começar" : "Tentar de novo"}
          </button>
        </div>
      )}

      {phase === "won" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Enigma resolvido"
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: "oklch(0 0 0 / 70%)", backdropFilter: "blur(10px)" }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border p-8 text-center"
            style={{
              background: "color-mix(in oklab, var(--stage) 40%, oklch(0.12 0.02 270))",
              boxShadow: "var(--shadow-stage)",
              animation: "popup-in 420ms cubic-bezier(0.2, 1.2, 0.3, 1) both",
            }}
          >
            <p className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground">Fim de jogo</p>
            <h2
              className="mt-3 text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl"
              style={{ textShadow: "0 0 50px var(--stage-glow)" }}
            >
              Parabéns!
            </h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Você conseguiu resolver o enigma.
            </p>
            <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {moves} movimentos · {clock} restantes no último nível
            </p>
            <button
              type="button"
              onClick={() => start(0)}
              className="mt-8 w-full rounded-full px-8 py-3 text-sm font-bold uppercase tracking-[0.25em] transition-transform hover:scale-105"
              style={{ background: "var(--stage-glow)", color: "oklch(0.12 0.02 270)", boxShadow: "var(--shadow-stage)" }}
            >
              Jogar de novo
            </button>
          </div>
        </div>
      )}


      {fx && <TransitionFx kind={fx} onDone={finishFx} />}
    </main>
  );
}
