"use client";

import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import type { BlockAggregate } from "@/server/types";

type Snapshot = {
  generatedAt: number;
  activeSessions: number;
  blocks: BlockAggregate[];
};

const anchors = [
  { x: 50, y: 44 },
  { x: 35, y: 31 },
  { x: 64, y: 29 },
  { x: 40, y: 62 },
  { x: 62, y: 63 },
  { x: 50, y: 76 }
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function TextLandscape() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    const socket = io();
    socket.emit("display:join");
    socket.on("aggregate:update", setSnapshot);
    return () => {
      socket.disconnect();
    };
  }, []);

  const maxViewTime = useMemo(() => {
    return Math.max(1, ...(snapshot?.blocks.map((block) => block.totalViewTime) ?? [1]));
  }, [snapshot]);

  if (!snapshot) {
    return <div className="display-empty">A text formed by reading.</div>;
  }

  return (
    <section className="landscape" aria-label="Collective reading trace">
      {snapshot.blocks.map((block, index) => {
        const weight = block.totalViewTime / maxViewTime;
        const anchor = anchors[index % anchors.length];
        const recentAge = block.lastActiveAt ? snapshot.generatedAt - block.lastActiveAt : Infinity;
        const recent = clamp(1 - recentAge / 7000, 0, 1);
        const centerPull = weight * 18;
        const drift = Math.sin((snapshot.generatedAt / 3500 + index) * 0.9) * (2 + recent * 2);
        const fontSize = clamp(18 + weight * 40 + block.viewCount * 1.4, 16, 76);
        const opacity = clamp(0.12 + weight * 0.64 + block.viewCount * 0.055 + recent * 0.22, 0.1, 0.94);
        const letterSpacing = clamp(block.revisitCount * 0.18, 0, 2.6);
        const blur = clamp(2.4 - weight * 2 - recent * 1.3, 0, 2.4);
        const x = anchor.x + (50 - anchor.x) * (centerPull / 100) + drift;
        const y = anchor.y + (50 - anchor.y) * (centerPull / 100) - drift * 0.55;

        return (
          <p
            className="landscape-line"
            key={`${block.pageId}:${block.blockId}`}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              fontSize,
              opacity,
              letterSpacing,
              filter: `blur(${blur}px) drop-shadow(0 0 ${recent * 18}px rgba(232, 227, 216, ${recent * 0.3}))`,
              zIndex: Math.round(weight * 100)
            }}
          >
            {block.text}
          </p>
        );
      })}
    </section>
  );
}
