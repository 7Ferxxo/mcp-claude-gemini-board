export type Priority = 'normal' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'blocked';
export type AgentName = string;

export interface Message {
  id: string;
  from: AgentName;
  to: AgentName;
  content: string;
  priority: Priority;
  read: boolean;
  created_at: string;
}

export interface TaskNote {
  agent: AgentName;
  content: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to: AgentName;
  created_by: AgentName;
  status: TaskStatus;
  notes: TaskNote[];
  created_at: string;
  updated_at: string;
}

export interface Thought {
  id: string;
  agent: AgentName;
  content: string;
  context: string;
  created_at: string;
}

export interface Snippet {
  id: string;
  from: AgentName;
  to: AgentName;
  title: string;
  language: string;
  code: string;
  description?: string;
  created_at: string;
}

export interface Board {
  messages: Message[];
  tasks: Task[];
  thoughts: Thought[];
  snippets: Snippet[];
}

// ─── Auto-purge limits ────────────────────────────────────────────────────────
export const PURGE_LIMITS = {
  MAX_READ_MESSAGES: 50,
  MAX_DONE_TASKS: 20,
  MAX_THOUGHTS: 100,
  MAX_SNIPPETS: 50,
} as const;
