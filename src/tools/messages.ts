import { v4 as uuidv4 } from 'uuid';
import { readBoard, writeBoard } from '../storage';
import { Priority } from '../types';

export function postMessage(from: string, to: string, content: string, priority: Priority = 'normal'): object {
  const board = readBoard();
  const message = {
    id: uuidv4(),
    from,
    to,
    content,
    priority,
    read: false,
    created_at: new Date().toISOString(),
  };
  board.messages.push(message);
  writeBoard(board);
  return { ok: true, message_id: message.id, sent_at: message.created_at };
}

export function readMessages(for_agent: string, include_read = false): object {
  const board = readBoard();
  const messages = board.messages.filter(
    (m) => m.to === for_agent && (include_read || !m.read)
  );

  // Mark as read
  let changed = false;
  for (const m of board.messages) {
    if (m.to === for_agent && !m.read) {
      m.read = true;
      changed = true;
    }
  }
  if (changed) writeBoard(board);

  return {
    count: messages.length,
    messages: messages.map((m) => ({
      id: m.id,
      from: m.from,
      content: m.content,
      priority: m.priority,
      sent_at: m.created_at,
    })),
  };
}
