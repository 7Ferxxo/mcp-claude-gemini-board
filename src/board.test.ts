import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Board } from './types';

// Mock the storage module entirely
let mockBoard: Board;

vi.mock('./storage', () => ({
  readBoard: () => mockBoard,
  writeBoard: (board: Board) => { mockBoard = board; },
}));

// Import AFTER the mock is set up
const { postMessage, readMessages } = await import('./tools/messages');
const { createTask, updateTask, listTasks } = await import('./tools/tasks');
const { addThought, getThoughts } = await import('./tools/thoughts');
const { shareSnippet, listSnippets } = await import('./tools/snippets');
const { deleteTask, deleteMessage, clearBoard, getBoardAnalytics } = await import('./tools/admin');

function freshBoard(): Board {
  return { messages: [], tasks: [], thoughts: [], snippets: [] };
}

// ─── Messages ─────────────────────────────────────────────────────────────────

describe('Messages', () => {
  beforeEach(() => { mockBoard = freshBoard(); });

  it('should post a message and return ok', () => {
    const result = postMessage('claude', 'gemini', 'Hello!', 'normal') as any;
    expect(result.ok).toBe(true);
    expect(result.message_id).toBeDefined();
    expect(mockBoard.messages).toHaveLength(1);
    expect(mockBoard.messages[0].content).toBe('Hello!');
    expect(mockBoard.messages[0].read).toBe(false);
  });

  it('should read unread messages and mark them as read', () => {
    postMessage('claude', 'gemini', 'Msg 1', 'normal');
    postMessage('claude', 'gemini', 'Msg 2', 'urgent');
    postMessage('gemini', 'claude', 'Not for gemini', 'normal');

    const result = readMessages('gemini', false) as any;
    expect(result.count).toBe(2);
    expect(result.messages[0].content).toBe('Msg 1');
    expect(result.messages[1].content).toBe('Msg 2');

    // After reading, messages should be marked as read
    expect(mockBoard.messages[0].read).toBe(true);
    expect(mockBoard.messages[1].read).toBe(true);
    expect(mockBoard.messages[2].read).toBe(false); // not for gemini
  });

  it('should not return read messages unless include_read is true', () => {
    postMessage('claude', 'gemini', 'Test', 'normal');
    readMessages('gemini', false); // marks as read

    const result = readMessages('gemini', false) as any;
    expect(result.count).toBe(0);

    const resultAll = readMessages('gemini', true) as any;
    expect(resultAll.count).toBe(1);
  });
});

// ─── Tasks ────────────────────────────────────────────────────────────────────

describe('Tasks', () => {
  beforeEach(() => { mockBoard = freshBoard(); });

  it('should create a task with pending status', () => {
    const result = createTask('Build UI', 'Create the dashboard', 'gemini', 'claude') as any;
    expect(result.ok).toBe(true);
    expect(mockBoard.tasks).toHaveLength(1);
    expect(mockBoard.tasks[0].status).toBe('pending');
    expect(mockBoard.tasks[0].title).toBe('Build UI');
  });

  it('should update a task status and add a note', () => {
    const created = createTask('Fix bug', 'Critical bug', 'claude', 'gemini') as any;
    const result = updateTask(created.task_id, 'in_progress', 'Working on it', 'claude') as any;
    expect(result.ok).toBe(true);
    expect(mockBoard.tasks[0].status).toBe('in_progress');
    expect(mockBoard.tasks[0].notes).toHaveLength(1);
    expect(mockBoard.tasks[0].notes[0].content).toBe('Working on it');
  });

  it('should fail to update a non-existent task', () => {
    const result = updateTask('fake-id', 'done') as any;
    expect(result.ok).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('should filter tasks by status', () => {
    createTask('Task A', 'Desc', 'gemini', 'claude');
    const created = createTask('Task B', 'Desc', 'gemini', 'claude') as any;
    updateTask(created.task_id, 'done');

    const pending = listTasks(undefined, 'pending') as any;
    expect(pending.count).toBe(1);

    const done = listTasks(undefined, 'done') as any;
    expect(done.count).toBe(1);
  });

  it('should filter tasks by assignee', () => {
    createTask('For Claude', 'Desc', 'claude', 'gemini');
    createTask('For Gemini', 'Desc', 'gemini', 'claude');

    const result = listTasks('gemini') as any;
    expect(result.count).toBe(1);
    expect(result.tasks[0].title).toBe('For Gemini');
  });
});

// ─── Thoughts ─────────────────────────────────────────────────────────────────

describe('Thoughts', () => {
  beforeEach(() => { mockBoard = freshBoard(); });

  it('should add a thought with context', () => {
    const result = addThought('gemini', 'Use Prisma instead of raw SQL', 'architecture') as any;
    expect(result.ok).toBe(true);
    expect(mockBoard.thoughts).toHaveLength(1);
    expect(mockBoard.thoughts[0].context).toBe('architecture');
  });

  it('should filter thoughts by context', () => {
    addThought('gemini', 'Frontend decision', 'frontend');
    addThought('claude', 'Backend decision', 'backend');

    const result = getThoughts('frontend') as any;
    expect(result.count).toBe(1);
    expect(result.thoughts[0].content).toBe('Frontend decision');
  });

  it('should limit thoughts returned', () => {
    for (let i = 0; i < 30; i++) {
      addThought('gemini', `Thought ${i}`, 'general');
    }
    const result = getThoughts(undefined, 5) as any;
    expect(result.count).toBe(5);
  });
});

// ─── Snippets ─────────────────────────────────────────────────────────────────

describe('Snippets', () => {
  beforeEach(() => { mockBoard = freshBoard(); });

  it('should share a code snippet', () => {
    const result = shareSnippet(
      'claude', 'gemini', 'User Model', 'typescript',
      'interface User { id: string; }', 'Prisma generated type'
    ) as any;
    expect(result.ok).toBe(true);
    expect(mockBoard.snippets).toHaveLength(1);
    expect(mockBoard.snippets[0].language).toBe('typescript');
  });

  it('should filter snippets by language', () => {
    shareSnippet('claude', 'gemini', 'SQL Query', 'sql', 'SELECT * FROM users');
    shareSnippet('claude', 'gemini', 'TS Type', 'typescript', 'type X = string');

    const result = listSnippets(undefined, 'sql') as any;
    expect(result.count).toBe(1);
    expect(result.snippets[0].title).toBe('SQL Query');
  });

  it('should filter snippets by agent', () => {
    shareSnippet('claude', 'gemini', 'From Claude', 'ts', 'code');
    shareSnippet('gemini', 'claude', 'To Claude', 'ts', 'code');
    shareSnippet('gemini', 'gemini', 'Not related', 'ts', 'code');

    const result = listSnippets('claude') as any;
    expect(result.count).toBe(2);  // claude appears in both 'from' and 'to'
  });
});

// ─── Admin ────────────────────────────────────────────────────────────────────

describe('Admin', () => {
  beforeEach(() => { mockBoard = freshBoard(); });

  it('should delete a task by id', () => {
    const created = createTask('To delete', 'Desc', 'gemini', 'claude') as any;
    expect(mockBoard.tasks).toHaveLength(1);

    const result = deleteTask(created.task_id) as any;
    expect(result.ok).toBe(true);
    expect(mockBoard.tasks).toHaveLength(0);
  });

  it('should fail to delete a non-existent task', () => {
    const result = deleteTask('fake-id') as any;
    expect(result.ok).toBe(false);
  });

  it('should delete a message by id', () => {
    const posted = postMessage('claude', 'gemini', 'To delete', 'normal') as any;
    expect(mockBoard.messages).toHaveLength(1);

    const result = deleteMessage(posted.message_id) as any;
    expect(result.ok).toBe(true);
    expect(mockBoard.messages).toHaveLength(0);
  });

  it('should require confirmation to clear board', () => {
    postMessage('claude', 'gemini', 'Msg', 'normal');
    const result = clearBoard(false) as any;
    expect(result.ok).toBe(false);
    expect(result.error).toContain('confirm=true');
    expect(mockBoard.messages).toHaveLength(1); // not cleared
  });

  it('should clear entire board when confirmed', () => {
    postMessage('claude', 'gemini', 'Msg', 'normal');
    createTask('Task', 'Desc', 'gemini', 'claude');
    addThought('gemini', 'Thought', 'general');

    const result = clearBoard(true) as any;
    expect(result.ok).toBe(true);
    expect(result.messages_cleared).toBe(1);
    expect(result.tasks_cleared).toBe(1);
    expect(result.thoughts_cleared).toBe(1);
    expect(mockBoard.messages).toHaveLength(0);
  });

  it('should return board analytics', () => {
    postMessage('claude', 'gemini', 'Msg 1', 'normal');
    postMessage('gemini', 'claude', 'Msg 2', 'normal');
    createTask('Task', 'Desc', 'gemini', 'claude');
    addThought('gemini', 'Thought', 'backend');

    const result = getBoardAnalytics() as any;
    expect(result.total_messages).toBe(2);
    expect(result.messages_by_agent).toEqual({ claude: 1, gemini: 1 });
    expect(result.total_tasks).toBe(1);
    expect(result.total_thoughts).toBe(1);
  });
});
