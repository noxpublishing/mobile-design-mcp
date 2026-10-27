export type Platform = 'ios' | 'android';
export type Provider = 'apple-design-awards' | 'google-play-awards' | 'local';
export interface Award {
  issuer: string;
  year: number;
  category: string;
  status: 'winner' | 'finalist';
  url: string;
}
export interface ReferenceApp {
  id: string;
  name: string;
  platforms: Platform[];
  description: string;
  tags: string[];
  source: { provider: Provider; url: string; observedAt: string };
  awards: Award[];
  media?: Array<{ kind: 'screenshot' | 'video'; url: string }>;
}
export interface Recording {
  id: string;
  appId?: string;
  title: string;
  platform: Platform;
  appVersion?: string;
  osVersion?: string;
  capturedAt: string;
  capturedAtBasis: 'user-provided' | 'file-mtime-estimate';
  sourcePath: string;
  storedPath: string;
  sha256: string;
  mediaType: 'image/png' | 'image/jpeg' | 'video/mp4' | 'video/webm' | 'video/quicktime';
  bytes: number;
  tags: string[];
}
export interface Flow {
  id: string;
  title: string;
  platform: Platform;
  appId?: string;
  steps: Array<{ recordingId: string; label: string; action?: string; startMs?: number; endMs?: number }>;
  tags: string[];
  createdAt: string;
}
