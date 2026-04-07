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

export interface Board {
  messages: Message[];
  tasks: Task[];
  thoughts: Thought[];
}
