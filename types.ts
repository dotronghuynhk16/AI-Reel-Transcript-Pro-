
export interface TranscriptResult {
  id: string;
  timestamp: number;
  content: string;
  language: string;
  source: string;
  title?: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
