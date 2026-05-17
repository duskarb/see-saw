"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { io } from "socket.io-client";
import type { BlockAggregate } from "@/server/types";

type Snapshot = {
  generatedAt: number;
  activeSessions: number;
  blocks: BlockAggregate[];
};

const anchors = [
  { x: 20, y: 20 },
  { x: 80, y: 20 },
  { x: 20, y: 80 },
  { x: 80, y: 80 },
  { x: 50, y: 15 },
  { x: 50, y: 85 },
  { x: 15, y: 50 },
  { x: 85, y: 50 },
  { x: 30, y: 35 },
  { x: 70, y: 35 },
  { x: 30, y: 65 },
  { x: 70, y: 65 }
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
    <section className="landscape" aria-label="Live Exhibition Text">
      {snapshot.blocks.map((block, index) => {
        const weight = clamp(block.totalViewTime / maxViewTime, 0, 1);
        
        // 실시간으로 읽히고 있는 텍스트인지 판별
        const recentAge = block.lastActiveAt ? snapshot.generatedAt - block.lastActiveAt : Infinity;
        const currentFocus = clamp(1 - recentAge / 2500, 0, 1);
        
        // 1. 시간이 지나면 사라짐 (예: 5분(300초) 지나면 크기가 0)
        const survivalRate = clamp(1 - recentAge / 300000, 0, 1);
        
        // 2. 오래 읽힘 -> 커짐
        const baseFontSize = 16 + weight * 100; // 최대 116px까지 커짐
        
        // 3. 빠르게 지나감 -> 벌어짐
        const averageTime = block.viewCount > 0 ? block.totalViewTime / block.viewCount : 0;
        const readDepth = block.viewCount > 0 ? clamp(averageTime / 4000, 0, 1) : 0;
        const letterSpacing = block.viewCount > 0 ? clamp((1 - readDepth) * 0.6, 0, 0.6) : 0; // 최대 0.6em 벌어짐
        
        // 4. 고정된 다양한 위치 (가운데 몰림 방지)
        const anchor = anchors[index % anchors.length];
        const x = anchor.x;
        const y = anchor.y;

        // ★ 현재 읽고 있는 텍스트가 치열하게 앞으로 튀어나오게
        const targetFontSize = baseFontSize + currentFocus * 120; 
        const finalFontSize = targetFontSize * survivalRate; // survivalRate 곱해서 서서히 크기가 줄어들며 소멸
        const finalZIndex = Math.round(weight * 100) + Math.round(currentFocus * 9999); 

        if (finalFontSize < 0.5) return null; // 크기가 거의 0이면 DOM에서 제거

        const isDecaying = currentFocus === 0;
        const transitionStyle = isDecaying 
          ? "all 2.5s linear" 
          : "all 0.2s ease-out";

        const lineStyle = {
          left: `${x}%`,
          top: `${y}%`,
          fontSize: `${finalFontSize}px`,
          opacity: 1, // 투명도는 100% 고정
          letterSpacing: `${letterSpacing}em`,
          zIndex: finalZIndex,
          transition: transitionStyle 
        } as CSSProperties;

        return (
          <p
            className="landscape-line"
            key={`${block.pageId}:${block.blockId}`}
            style={lineStyle}
          >
            {block.text}
          </p>
        );
      })}
    </section>
  );
}
