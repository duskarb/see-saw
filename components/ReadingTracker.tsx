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

    const allBlockElements = Array.from(document.querySelectorAll<HTMLElement>("[data-block-id]"));
    let activeBlocks = new Set<string>();

    const updateActiveBlocks = () => {
      if (allBlockElements.length === 0) return;

      const scrollDepth = getScrollDepth();
      const activeIndex = scrollDepth === 1 
        ? allBlockElements.length - 1 
        : Math.floor(scrollDepth * allBlockElements.length);
        
      const activeElement = allBlockElements[activeIndex];
      const selectedBlockId = activeElement.dataset.blockId!;
      
      const nextActive = new Set([selectedBlockId]);

      for (const blockId of activeBlocks) {
        if (!nextActive.has(blockId)) {
          const element = allBlockElements.find(el => el.dataset.blockId === blockId);
          if (element) {
            element.dataset.readingState = "leaving";
            element.style.setProperty("--reading-pressure", "0");
            window.setTimeout(() => {
              if (element.dataset.readingState === "leaving") {
                delete element.dataset.readingState;
              }
            }, 900);

            emitEvent({
              blockId,
              eventType: "exit",
              visibleRatio: 0,
              scrollY: window.scrollY,
              scrollDepth
            });
          }
        }
      }

      for (const blockId of nextActive) {
        const element = activeElement;
        const wasActive = activeBlocks.has(blockId);
        element.dataset.readingState = "active";
        element.style.setProperty("--reading-pressure", "1");

        if (!wasActive) {
          emitEvent({
            blockId,
            eventType: "enter",
            visibleRatio: 1,
            scrollY: window.scrollY,
            scrollDepth
          });
        }
      }

      activeBlocks = nextActive;
    };

    // Initial evaluation
    updateActiveBlocks();

    let lastScrollEmit = 0;
    const onScroll = () => {
      updateActiveBlocks();

      const now = Date.now();
      if (now - lastScrollEmit < 180) return;
      lastScrollEmit = now;

      activeBlocks.forEach((blockId) => {
        emitEvent({
          blockId,
          eventType: "scroll",
          visibleRatio: 1,
          scrollY: window.scrollY,
          scrollDepth: getScrollDepth()
        });
      });
    };

    const heartbeat = window.setInterval(() => {
      activeBlocks.forEach((blockId) => {
        emitEvent({
          blockId,
          eventType: "heartbeat",
          visibleRatio: 1,
          scrollY: window.scrollY,
          scrollDepth: getScrollDepth()
        });
      });
    }, 350);

    const leave = () => {
      activeBlocks.forEach((blockId) => {
        emitEvent({
          blockId,
          eventType: "leave",
          visibleRatio: 1,
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
      window.clearInterval(heartbeat);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", leave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      // delay disconnect so the leave event has time to transmit
      window.setTimeout(() => socket.disconnect(), 300);
    };
  }, [pageId, sessionId]);

  return null;
}
