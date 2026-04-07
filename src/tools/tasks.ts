import { v4 as uuidv4 } from 'uuid';
import { readBoard, writeBoard } from '../storage';
import { TaskStatus } from '../types';

export function createTask(
  title: string,
  description: string,
  assigned_to: string,
  created_by: string
): object {
  const board = readBoard();
  const now = new Date().toISOString();
  const task = {
    id: uuidv4(),
    title,
    description,
    assigned_to,
    created_by,
    status: 'pending' as TaskStatus,
    notes: [],
    created_at: now,
    updated_at: now,
  };
  board.tasks.push(task);
  writeBoard(board);
  return { ok: true, task_id: task.id };
}

export function updateTask(
  id: string,
  status: TaskStatus,
  note?: string,
  agent?: string
): object {
  const board = readBoard();
  const task = board.tasks.find((t) => t.id === id);
  if (!task) return { ok: false, error: `Task ${id} not found` };

  task.status = status;
  task.updated_at = new Date().toISOString();

  if (note && agent) {
    task.notes.push({ agent, content: note, created_at: task.updated_at });
  }

  writeBoard(board);
  return { ok: true, task_id: id, status };
}

export function listTasks(assigned_to?: string, status?: TaskStatus): object {
  const board = readBoard();
  let tasks = board.tasks;

  if (assigned_to) tasks = tasks.filter((t) => t.assigned_to === assigned_to);
  if (status) tasks = tasks.filter((t) => t.status === status);

  return {
    count: tasks.length,
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      assigned_to: t.assigned_to,
      created_by: t.created_by,
      status: t.status,
      notes_count: t.notes.length,
      latest_note: t.notes.length > 0 ? t.notes[t.notes.length - 1].content : null,
      created_at: t.created_at,
      updated_at: t.updated_at,
    })),
  };
}
