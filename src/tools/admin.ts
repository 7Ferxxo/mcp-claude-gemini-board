import { readBoard, writeBoard } from '../storage';

export function deleteTask(id: string): object {
  const board = readBoard();
  const idx = board.tasks.findIndex((t) => t.id === id);
  if (idx === -1) return { ok: false, error: `Task ${id} not found` };

  board.tasks.splice(idx, 1);
  writeBoard(board);
  return { ok: true, deleted_task_id: id };
}

export function deleteMessage(id: string): object {
  const board = readBoard();
  const idx = board.messages.findIndex((m) => m.id === id);
  if (idx === -1) return { ok: false, error: `Message ${id} not found` };

  board.messages.splice(idx, 1);
  writeBoard(board);
  return { ok: true, deleted_message_id: id };
}

export function clearBoard(confirm: boolean): object {
  if (!confirm) {
    return {
      ok: false,
      error: 'You must set confirm=true to clear the entire board. This action is irreversible.',
    };
  }

  const board = readBoard();
  const stats = {
    messages_cleared: board.messages.length,
    tasks_cleared: board.tasks.length,
    thoughts_cleared: board.thoughts.length,
    snippets_cleared: board.snippets.length,
  };

  writeBoard({ messages: [], tasks: [], thoughts: [], snippets: [] });
  return { ok: true, ...stats };
}

export function getBoardAnalytics(): object {
  const board = readBoard();

  // Messages per agent
  const messagesByAgent: Record<string, number> = {};
  for (const m of board.messages) {
    messagesByAgent[m.from] = (messagesByAgent[m.from] || 0) + 1;
  }

  // Task stats
  const tasksByStatus: Record<string, number> = {};
  for (const t of board.tasks) {
    tasksByStatus[t.status] = (tasksByStatus[t.status] || 0) + 1;
  }

  // Tasks per agent
  const tasksByAgent: Record<string, number> = {};
  for (const t of board.tasks) {
    tasksByAgent[t.assigned_to] = (tasksByAgent[t.assigned_to] || 0) + 1;
  }

  // Avg resolution time for done tasks
  const doneTasks = board.tasks.filter((t) => t.status === 'done');
  let avgResolutionMs = 0;
  if (doneTasks.length > 0) {
    const totalMs = doneTasks.reduce((sum, t) => {
      return sum + (new Date(t.updated_at).getTime() - new Date(t.created_at).getTime());
    }, 0);
    avgResolutionMs = totalMs / doneTasks.length;
  }

  // Thoughts per agent
  const thoughtsByAgent: Record<string, number> = {};
  for (const th of board.thoughts) {
    thoughtsByAgent[th.agent] = (thoughtsByAgent[th.agent] || 0) + 1;
  }

  return {
    total_messages: board.messages.length,
    unread_messages: board.messages.filter((m) => !m.read).length,
    messages_by_agent: messagesByAgent,
    total_tasks: board.tasks.length,
    tasks_by_status: tasksByStatus,
    tasks_by_agent: tasksByAgent,
    avg_resolution_time_minutes: Math.round(avgResolutionMs / 60000),
    total_thoughts: board.thoughts.length,
    thoughts_by_agent: thoughtsByAgent,
    total_snippets: board.snippets.length,
  };
}
