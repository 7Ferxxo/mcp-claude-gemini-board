import fs from 'fs';
import path from 'path';
import { Board, PURGE_LIMITS } from './types';

const BOARD_PATH = path.join(__dirname, '..', 'board.json');

function emptyBoard(): Board {
  return { messages: [], tasks: [], thoughts: [], snippets: [] };
}

export function readBoard(): Board {
  try {
    if (!fs.existsSync(BOARD_PATH)) {
      return emptyBoard();
    }
    const raw = fs.readFileSync(BOARD_PATH, 'utf8');
    const board = JSON.parse(raw) as Board;

    // Ensure backwards compatibility for older board.json files
    if (!board.snippets) board.snippets = [];

    return board;
  } catch {
    return emptyBoard();
  }
}

export function writeBoard(board: Board): void {
  // ─── Auto-purge before writing ──────────────────────────────────────
  autoPurge(board);

  const tmp = BOARD_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(board, null, 2), 'utf8');
  fs.renameSync(tmp, BOARD_PATH);
}

/**
 * Automatically trims old data to prevent the board.json from growing
 * unboundedly. Only removes data that is unlikely to be needed:
 * - Read messages beyond the limit
 * - Tasks marked as 'done' beyond the limit
 * - Oldest thoughts beyond the limit
 * - Oldest snippets beyond the limit
 */
function autoPurge(board: Board): void {
  // Purge read messages (keep recent ones)
  const readMessages = board.messages.filter((m) => m.read);
  if (readMessages.length > PURGE_LIMITS.MAX_READ_MESSAGES) {
    const excessCount = readMessages.length - PURGE_LIMITS.MAX_READ_MESSAGES;
    let removed = 0;
    board.messages = board.messages.filter((m) => {
      if (m.read && removed < excessCount) {
        removed++;
        return false;
      }
      return true;
    });
  }

  // Purge completed tasks
  const doneTasks = board.tasks.filter((t) => t.status === 'done');
  if (doneTasks.length > PURGE_LIMITS.MAX_DONE_TASKS) {
    const excessCount = doneTasks.length - PURGE_LIMITS.MAX_DONE_TASKS;
    let removed = 0;
    board.tasks = board.tasks.filter((t) => {
      if (t.status === 'done' && removed < excessCount) {
        removed++;
        return false;
      }
      return true;
    });
  }

  // Purge oldest thoughts
  if (board.thoughts.length > PURGE_LIMITS.MAX_THOUGHTS) {
    board.thoughts = board.thoughts.slice(-PURGE_LIMITS.MAX_THOUGHTS);
  }

  // Purge oldest snippets
  if (board.snippets.length > PURGE_LIMITS.MAX_SNIPPETS) {
    board.snippets = board.snippets.slice(-PURGE_LIMITS.MAX_SNIPPETS);
  }
}
