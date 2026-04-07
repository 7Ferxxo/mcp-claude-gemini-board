import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { postMessage, readMessages } from './tools/messages';
import { createTask, updateTask, listTasks } from './tools/tasks';
import { addThought, getThoughts } from './tools/thoughts';
import { readBoard } from './storage';

const server = new Server(
  { name: 'agent-board', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// ─── Tool definitions ────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'post_message',
      description: 'Send a message from one agent to another. Use this to communicate with the other AI agent.',
      inputSchema: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Your agent name (e.g. "claude" or "gemini")' },
          to: { type: 'string', description: 'Recipient agent name' },
          content: { type: 'string', description: 'Message content' },
          priority: { type: 'string', enum: ['normal', 'urgent'], description: 'Message priority (default: normal)' },
        },
        required: ['from', 'to', 'content'],
      },
    },
    {
      name: 'read_messages',
      description: 'Read unread messages addressed to you. Automatically marks them as read.',
      inputSchema: {
        type: 'object',
        properties: {
          for_agent: { type: 'string', description: 'Your agent name to retrieve messages for' },
          include_read: { type: 'boolean', description: 'Include already-read messages (default: false)' },
        },
        required: ['for_agent'],
      },
    },
    {
      name: 'create_task',
      description: 'Create a task and assign it to an agent.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Short task title' },
          description: { type: 'string', description: 'Detailed description of what needs to be done' },
          assigned_to: { type: 'string', description: 'Agent responsible for this task' },
          created_by: { type: 'string', description: 'Agent creating this task' },
        },
        required: ['title', 'description', 'assigned_to', 'created_by'],
      },
    },
    {
      name: 'update_task',
      description: 'Update a task status and optionally add a progress note.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Task ID' },
          status: { type: 'string', enum: ['pending', 'in_progress', 'done', 'blocked'], description: 'New status' },
          note: { type: 'string', description: 'Optional progress note' },
          agent: { type: 'string', description: 'Your agent name (required if adding a note)' },
        },
        required: ['id', 'status'],
      },
    },
    {
      name: 'list_tasks',
      description: 'List tasks, optionally filtered by assignee or status.',
      inputSchema: {
        type: 'object',
        properties: {
          assigned_to: { type: 'string', description: 'Filter by assigned agent' },
          status: { type: 'string', enum: ['pending', 'in_progress', 'done', 'blocked'], description: 'Filter by status' },
        },
      },
    },
    {
      name: 'add_thought',
      description: 'Log a technical decision, reasoning, or insight for the other agent to read.',
      inputSchema: {
        type: 'object',
        properties: {
          agent: { type: 'string', description: 'Your agent name' },
          content: { type: 'string', description: 'The thought or decision to record' },
          context: { type: 'string', description: 'Topic/area this thought relates to (e.g. "backend", "frontend", "architecture")' },
        },
        required: ['agent', 'content'],
      },
    },
    {
      name: 'get_thoughts',
      description: 'Read logged thoughts and decisions, optionally filtered by context/topic.',
      inputSchema: {
        type: 'object',
        properties: {
          context: { type: 'string', description: 'Filter by context/topic' },
          limit: { type: 'number', description: 'Max number of thoughts to return (default: 20)' },
        },
      },
    },
    {
      name: 'get_board_summary',
      description: 'Get a full snapshot of the board: unread messages, active tasks, and recent thoughts. Call this at the start of a session to get up to speed.',
      inputSchema: {
        type: 'object',
        properties: {
          for_agent: { type: 'string', description: 'Your agent name (used to highlight messages addressed to you)' },
        },
      },
    },
  ],
}));

// ─── Tool execution ───────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;

  try {
    let result: object;

    switch (name) {
      case 'post_message':
        result = postMessage(
          String(args.from),
          String(args.to),
          String(args.content),
          (args.priority as 'normal' | 'urgent') ?? 'normal'
        );
        break;

      case 'read_messages':
        result = readMessages(String(args.for_agent), Boolean(args.include_read));
        break;

      case 'create_task':
        result = createTask(
          String(args.title),
          String(args.description),
          String(args.assigned_to),
          String(args.created_by)
        );
        break;

      case 'update_task':
        result = updateTask(
          String(args.id),
          args.status as 'pending' | 'in_progress' | 'done' | 'blocked',
          args.note ? String(args.note) : undefined,
          args.agent ? String(args.agent) : undefined
        );
        break;

      case 'list_tasks':
        result = listTasks(
          args.assigned_to ? String(args.assigned_to) : undefined,
          args.status as 'pending' | 'in_progress' | 'done' | 'blocked' | undefined
        );
        break;

      case 'add_thought':
        result = addThought(
          String(args.agent),
          String(args.content),
          args.context ? String(args.context) : 'general'
        );
        break;

      case 'get_thoughts':
        result = getThoughts(
          args.context ? String(args.context) : undefined,
          args.limit ? Number(args.limit) : 20
        );
        break;

      case 'get_board_summary': {
        const board = readBoard();
        const for_agent = args.for_agent ? String(args.for_agent) : null;
        const unread = board.messages.filter((m) => !m.read && (!for_agent || m.to === for_agent));
        const active = board.tasks.filter((t) => t.status !== 'done');
        const recentThoughts = board.thoughts.slice(-10);
        result = {
          unread_messages: unread.length,
          messages_for_you: unread.map((m) => ({ from: m.from, content: m.content, priority: m.priority, sent_at: m.created_at })),
          active_tasks: active.length,
          tasks: active.map((t) => ({ id: t.id, title: t.title, assigned_to: t.assigned_to, status: t.status })),
          recent_thoughts: recentThoughts.map((t) => ({ agent: t.agent, content: t.content, context: t.context })),
        };
        break;
      }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
      isError: true,
    };
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('agent-board MCP server running on stdio');
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
