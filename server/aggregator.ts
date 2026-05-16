import texts from "../data/texts.json";
import type { BlockAggregate, ReadingEvent, SessionData, TextsByPage } from "./types";

const catalog = texts as TextsByPage;

type OpenView = {
  enteredAt: number;
  visibleRatio: number;
};

const aggregates = new Map<string, BlockAggregate>();
const openViews = new Map<string, OpenView>();
const viewedBlocksBySession = new Map<string, Set<string>>();
const visibleRatioSamples = new Map<string, { total: number; count: number }>();
const sessions = new Map<string, SessionData>();

function keyFor(pageId: string, blockId: string) {
  return `${pageId}:${blockId}`;
}

function viewKey(event: Pick<ReadingEvent, "sessionId" | "pageId" | "blockId">) {
  return `${event.sessionId}:${event.pageId}:${event.blockId}`;
}

function findBlockText(pageId: string, blockId: string) {
  return catalog[pageId]?.blocks.find((block) => block.id === blockId)?.text ?? "";
}

function ensureAggregate(pageId: string, blockId: string) {
  const key = keyFor(pageId, blockId);
  const existing = aggregates.get(key);
  if (existing) return existing;

  const aggregate: BlockAggregate = {
    blockId,
    text: findBlockText(pageId, blockId),
    totalViewTime: 0,
    viewCount: 0,
    revisitCount: 0,
    averageVisibleRatio: 0
  };
  aggregates.set(key, aggregate);
  return aggregate;
}

function recordVisibleRatio(pageId: string, blockId: string, ratio = 0) {
  const key = keyFor(pageId, blockId);
  const current = visibleRatioSamples.get(key) ?? { total: 0, count: 0 };
  current.total += Math.max(0, Math.min(1, ratio));
  current.count += 1;
  visibleRatioSamples.set(key, current);

  const aggregate = ensureAggregate(pageId, blockId);
  aggregate.averageVisibleRatio = current.total / current.count;
}

function closeOpenView(event: ReadingEvent) {
  const openKey = viewKey(event);
  const open = openViews.get(openKey);
  if (!open) return;

  const aggregate = ensureAggregate(event.pageId, event.blockId);
  const elapsed = Math.max(0, event.timestamp - open.enteredAt);
  aggregate.totalViewTime += elapsed * Math.max(0.15, open.visibleRatio);
  aggregate.lastActiveAt = event.timestamp;
  openViews.delete(openKey);
}

export function registerSession(session: SessionData) {
  sessions.set(session.sessionId, session);
}

export function ingestEvent(event: ReadingEvent) {
  const aggregate = ensureAggregate(event.pageId, event.blockId);
  aggregate.lastActiveAt = event.timestamp;

  if (typeof event.visibleRatio === "number") {
    recordVisibleRatio(event.pageId, event.blockId, event.visibleRatio);
  }

  if (event.eventType === "enter") {
    closeOpenView(event);

    const sessionBlocks = viewedBlocksBySession.get(event.sessionId) ?? new Set<string>();
    if (sessionBlocks.has(event.blockId)) {
      aggregate.revisitCount += 1;
    } else {
      aggregate.viewCount += 1;
      sessionBlocks.add(event.blockId);
      viewedBlocksBySession.set(event.sessionId, sessionBlocks);
    }

    openViews.set(viewKey(event), {
      enteredAt: event.timestamp,
      visibleRatio: event.visibleRatio ?? 1
    });
  }

  if (event.eventType === "heartbeat") {
    const open = openViews.get(viewKey(event));
    if (open) {
      open.visibleRatio = event.visibleRatio ?? open.visibleRatio;
    }
  }

  if (event.eventType === "exit" || event.eventType === "leave") {
    closeOpenView(event);
  }

  if (event.eventType === "leave") {
    const session = sessions.get(event.sessionId);
    if (session) session.endedAt = event.timestamp;
  }
}

export function getSnapshot() {
  for (const [pageId, page] of Object.entries(catalog)) {
    for (const block of page.blocks) ensureAggregate(pageId, block.id);
  }

  return {
    generatedAt: Date.now(),
    activeSessions: [...sessions.values()].filter((session) => !session.endedAt).length,
    blocks: [...aggregates.values()]
  };
}
