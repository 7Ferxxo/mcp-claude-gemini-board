import fs from 'fs';
import path from 'path';
import { Board } from './types';

const BOARD_PATH = path.join(__dirname, '..', 'board.json');

function emptyBoard(): Board {
  return { messages: [], tasks: [], thoughts: [] };
}

export function readBoard(): Board {
  try {
    if (!fs.existsSync(BOARD_PATH)) {
      return emptyBoard();
    }
    const raw = fs.readFileSync(BOARD_PATH, 'utf8');
    return JSON.parse(raw) as Board;
  } catch {
    return emptyBoard();
  }
}

export function writeBoard(board: Board): void {
  const tmp = BOARD_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(board, null, 2), 'utf8');
  fs.renameSync(tmp, BOARD_PATH);
}
