export interface UserMsg {
  kind: "user";
  text: string;
  time: string;
}

export interface TextMsg {
  kind: "text";
  text: string;
  time: string;
}

export interface ChartDataKey {
  key: string;
  color: string;
}

export interface ChartCard {
  id: string;
  title: string;
  type: "area" | "bar";
  data: Record<string, string | number>[];
  keys: ChartDataKey[];
  xKey: string;
  confidence: number;
  timestamp: string;
}

export interface AnalMsg {
  kind: "analysis";
  time: string;
  duration: string;
  rootCause: string;
  impact: string[];
  recommendation: string;
  charts?: ChartCard[];
}

export type Message = UserMsg | TextMsg | AnalMsg;

export interface Session {
  id: string;
  status: "active" | "completed";
  title: string;
  preview: string;
  age: string;
  messages: Message[];
}
