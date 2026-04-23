export interface Profile {
  id: string;
  updated_at: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments: Array<{
    id: string;
    dataUrl: string;
    name: string;
    type: string;
  }>;
  tool_runs: Array<{
    id: string;
    tool: string;
    input: Record<string, unknown>;
    output?: string;
  }>;
  created_at: string;
}