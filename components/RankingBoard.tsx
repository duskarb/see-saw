"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { io } from "socket.io-client";
import texts from "@/data/texts.json";
import type { BlockAggregate, TextsByPage } from "@/server/types";

type Snapshot = {
  generatedAt: number;
  activeSessions: number;
  blocks: BlockAggregate[];
};

type ProjectRank = {
  pageId: string;
  title: string;
  course: string;
  totalViewTime: number;
  viewCount: number;
  activeWeight: number;
  lastActiveAt: number;
};

type RankTrend = "steady" | "up" | "down";

type TrendRecord = {
  trend: Exclude<RankTrend, "steady">;
  expiresAt: number;
};

const catalog = texts as TextsByPage;
const visiblePages = Object.entries(catalog).filter(([pageId]) => pageId !== "object-01");
const trendDuration = 30000;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatTime(milliseconds: number) {
  const seconds = Math.round(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes <= 0) return `${remainingSeconds}s`;
  return `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`;
}

export default function RankingBoard() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [trendRecords, setTrendRecords] = useState<Map<string, TrendRecord>>(new Map());
  const previousPositionsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const socket = io();
    socket.emit("ranking:join");
    socket.on("aggregate:update", setSnapshot);
    return () => {
      socket.disconnect();
    };
  }, []);

  const ranks = useMemo<ProjectRank[]>(() => {
    const byPage = new Map<string, ProjectRank>();
    const generatedAt = snapshot?.generatedAt ?? Date.now();

    for (const [pageId, page] of visiblePages) {
      byPage.set(pageId, {
        pageId,
        title: page.title,
        course: page.course,
        totalViewTime: 0,
        viewCount: 0,
        activeWeight: 0,
        lastActiveAt: 0
      });
    }

    for (const block of snapshot?.blocks ?? []) {
      const rank = byPage.get(block.pageId);
      if (!rank) continue;

      const recentAge = block.lastActiveAt ? generatedAt - block.lastActiveAt : Infinity;
      const activeWeight = clamp(1 - recentAge / 8000, 0, 1);

      rank.totalViewTime += block.totalViewTime;
      rank.viewCount += block.viewCount;
      rank.activeWeight = Math.max(rank.activeWeight, activeWeight);
      rank.lastActiveAt = Math.max(rank.lastActiveAt, block.lastActiveAt ?? 0);
    }

    return [...byPage.values()].sort((a, b) => {
      const scoreDelta = b.totalViewTime - a.totalViewTime;
      if (Math.abs(scoreDelta) > 1) return scoreDelta;
      return b.activeWeight - a.activeWeight;
    });
  }, [snapshot]);

  const maxViewTime = Math.max(1, ...ranks.map((rank) => rank.totalViewTime));
  const rankTrends = useMemo(() => {
    const now = snapshot?.generatedAt ?? Date.now();

    return new Map(
      ranks.map((rank, index) => {
        const record = trendRecords.get(rank.pageId);

        if (record && record.expiresAt > now) return [rank.pageId, record.trend];
        if (rank.activeWeight > 0.45) return [rank.pageId, "up"];
        return [rank.pageId, "steady"];
      })
    ) as Map<string, RankTrend>;
  }, [ranks, snapshot?.generatedAt, trendRecords]);

  useEffect(() => {
    const now = snapshot?.generatedAt ?? Date.now();
    const previousPositions = previousPositionsRef.current;

    setTrendRecords((currentRecords) => {
      const nextRecords = new Map(
        [...currentRecords].filter(([, record]) => record.expiresAt > now)
      );

      for (const [index, rank] of ranks.entries()) {
        const previousIndex = previousPositions.get(rank.pageId);
        if (previousIndex === undefined || previousIndex === index) continue;

        nextRecords.set(rank.pageId, {
          trend: previousIndex > index ? "up" : "down",
          expiresAt: now + trendDuration
        });
      }

      return nextRecords;
    });

    previousPositionsRef.current = new Map(ranks.map((rank, index) => [rank.pageId, index]));
  }, [ranks, snapshot?.generatedAt]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      setTrendRecords((currentRecords) => {
        const nextRecords = new Map(
          [...currentRecords].filter(([, record]) => record.expiresAt > now)
        );

        return nextRecords.size === currentRecords.size ? currentRecords : nextRecords;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="ranking-board" aria-label="Live project ranking">
      <header className="ranking-header">
        <div>
          <div className="ranking-kicker">Reading Index</div>
          <h1>Project Ranking</h1>
        </div>
        <div className="ranking-session-count">{snapshot?.activeSessions ?? 0}</div>
      </header>

      <ol className="ranking-list">
        {ranks.map((rank, index) => {
          const ratio = rank.totalViewTime / maxViewTime;
          const isActive = rank.activeWeight > 0;
          const trend = rankTrends.get(rank.pageId) ?? "steady";

          return (
            <li
              className="ranking-item"
              data-active={isActive ? "true" : undefined}
              data-trend={trend}
              key={rank.pageId}
              style={{
                "--rank-ratio": ratio.toFixed(4),
                "--active-weight": rank.activeWeight.toFixed(4)
              } as CSSProperties & Record<"--rank-ratio" | "--active-weight", string>}
            >
              <div className="ranking-number">{String(index + 1).padStart(2, "0")}</div>
              <div className="ranking-body">
                <div className="ranking-title-row">
                  <h2>{rank.title}</h2>
                  <div className="ranking-value">
                    <span className="ranking-triangle" aria-hidden="true" />
                    <span>{formatTime(rank.totalViewTime)}</span>
                  </div>
                </div>
                <div className="ranking-meta">
                  <span>{rank.course}</span>
                  <span>{rank.viewCount} reads</span>
                </div>
                <div className="ranking-bar" />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
