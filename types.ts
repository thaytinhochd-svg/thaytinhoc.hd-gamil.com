
export interface Transcript {
  speaker: 'user' | 'model';
  text: string;
  isFinal: boolean;
}

export interface ChatMessage {
  speaker: 'user' | 'model';
  text: string;
}
