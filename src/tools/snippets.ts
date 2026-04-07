import { v4 as uuidv4 } from 'uuid';
import { readBoard, writeBoard } from '../storage';

export function shareSnippet(
  from: string,
  to: string,
  title: string,
  language: string,
  code: string,
  description?: string
): object {
  const board = readBoard();
  const snippet = {
    id: uuidv4(),
    from,
    to,
    title,
    language,
    code,
    description,
    created_at: new Date().toISOString(),
  };
  board.snippets.push(snippet);
  writeBoard(board);
  return { ok: true, snippet_id: snippet.id, sent_at: snippet.created_at };
}

export function listSnippets(
  for_agent?: string,
  language?: string,
  limit = 20
): object {
  const board = readBoard();
  let snippets = board.snippets;

  if (for_agent) snippets = snippets.filter((s) => s.to === for_agent || s.from === for_agent);
  if (language) snippets = snippets.filter((s) => s.language === language);

  const recent = snippets.slice(-limit);
  return {
    count: recent.length,
    snippets: recent.map((s) => ({
      id: s.id,
      from: s.from,
      to: s.to,
      title: s.title,
      language: s.language,
      code: s.code,
      description: s.description,
      created_at: s.created_at,
    })),
  };
}
