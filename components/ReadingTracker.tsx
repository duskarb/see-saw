"use client";

import { useEffect, useMemo, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import type { ReadingEvent, SessionData } from "@/server/types";

type Props = {
  pageId: string;
};

function makeUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function createSessionId() {
  const existing = window.sessionStorage.getItem("altered-seeing-session");
  if (existing) return existing;

  const id = makeUUID();
  window.sessionStorage.setItem("altered-seeing-session", id);
  return id;
}

function getScrollDepth() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollable <= 0) return 1;
  return Math.min(1, Math.max(0, window.scrollY / scrollable));
}

export default function ReadingTracker({ pageId }: Props) {
  const socketRef = useRef<Socket | null>(null);
  const sessionId = useMemo(() => {
    if (typeof window === "undefined") return "";
    return createSessionId();
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const socket = io();
    socketRef.current = socket;

    const emitEvent = (event: Omit<ReadingEvent, "sessionId" | "pageId" | "timestamp">) => {
      socket.emit("reading:event", {
        ...event,
        sessionId,
        pageId,
        timestamp: Date.now()
      } satisfies ReadingEvent);
    };

    const session: SessionData = {
      sessionId,
      pageId,
      startedAt: Date.now(),
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height
    };
    socket.emit("session:start", session);

    const visibleBlocks = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const blockId = (entry.target as HTMLElement).dataset.blockId;
          if (!blockId) return;

          if (entry.isIntersecting && entry.intersectionRatio > 0.18) {
            const wasVisible = visibleBlocks.has(blockId);
            visibleBlocks.set(blockId, entry.intersectionRatio);
            emitEvent({
              blockId,
              eventType: wasVisible ? "heartbeat" : "enter",
              visibleRatio: entry.intersectionRatio,
              scrollY: window.scrollY,
              scrollDepth: getScrollDepth()
            });
          } else if (visibleBlocks.has(blockId)) {
            visibleBlocks.delete(blockId);
            emitEvent({
              blockId,
              eventType: "exit",
              visibleRatio: entry.intersectionRatio,
              scrollY: window.scrollY,
              scrollDepth: getScrollDepth()
            });
          }
        });
      },
      {
        threshold: [0, 0.18, 0.35, 0.55, 0.75, 1],
        rootMargin: "0px 0px -12% 0px"
      }
    );

    document.querySelectorAll<HTMLElement>("[data-block-id]").forEach((element) => {
      observer.observe(element);
    });

    let lastScrollEmit = 0;
    const onScroll = () => {
      const now = Date.now();
      if (now - lastScrollEmit < 180) return;
      lastScrollEmit = now;

      const deepestVisibleBlock = [...visibleBlocks.entries()].sort((a, b) => b[1] - a[1])[0];
      if (!deepestVisibleBlock) return;

      emitEvent({
        blockId: deepestVisibleBlock[0],
        eventType: "scroll",
        visibleRatio: deepestVisibleBlock[1],
        scrollY: window.scrollY,
        scrollDepth: getScrollDepth()
      });
    };

    const heartbeat = window.setInterval(() => {
      visibleBlocks.forEach((visibleRatio, blockId) => {
        emitEvent({
          blockId,
          eventType: "heartbeat",
          visibleRatio,
          scrollY: window.scrollY,
          scrollDepth: getScrollDepth()
        });
      });
    }, 350);

    const leave = () => {
      visibleBlocks.forEach((visibleRatio, blockId) => {
        emitEvent({
          blockId,
          eventType: "leave",
          visibleRatio,
          scrollY: window.scrollY,
          scrollDepth: getScrollDepth()
        });
      });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") leave();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", leave);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      leave();
      observer.disconnect();
      window.clearInterval(heartbeat);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", leave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      socket.disconnect();
    };
  }, [pageId, sessionId]);

  return null;
}
