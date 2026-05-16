export type ReadingEvent = {
  sessionId: string;
  pageId: string;
  blockId: string;
  eventType: "enter" | "exit" | "heartbeat" | "scroll" | "leave";
  timestamp: number;
  visibleRatio?: number;
  scrollY?: number;
  scrollDepth?: number;
};

export type SessionData = {
  sessionId: string;
  pageId: string;
  startedAt: number;
  endedAt?: number;
  userAgent?: string;
  language?: string;
  screenWidth?: number;
  screenHeight?: number;
};

export type TextBlock = {
  id: string;
  text: string;
};

export type BlockAggregate = {
  pageId: string;
  blockId: string;
  text: string;
  totalViewTime: number;
  viewCount: number;
  revisitCount: number;
  averageVisibleRatio: number;
  lastActiveAt?: number;
};

export type PageText = {
  objectNo: string;
  title: string;
  author: string;
  year: string;
  course: string;
  material: string;
  summary: string;
  blocks: TextBlock[];
};

export type TextsByPage = Record<string, PageText>;
