import { v4 as uuidv4 } from 'uuid';
import { readBoard, writeBoard } from '../storage';

export function addThought(agent: string, content: string, context = 'general'): object {
  const board = readBoard();
  const thought = {
    id: uuidv4(),
    agent,
    content,
    context,
    created_at: new Date().toISOString(),
  };
  board.thoughts.push(thought);
  writeBoard(board);
  return { ok: true, thought_id: thought.id };
}

export function getThoughts(context?: string, limit = 20): object {
  const board = readBoard();
  let thoughts = board.thoughts;
  if (context) thoughts = thoughts.filter((t) => t.context === context);

  const recent = thoughts.slice(-limit);
  return {
    count: recent.length,
    thoughts: recent.map((t) => ({
      id: t.id,
      agent: t.agent,
      content: t.content,
      context: t.context,
      created_at: t.created_at,
    })),
  };
}
