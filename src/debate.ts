/**
 * debate.ts — Orquestador de debate multi-agente
 *
 * MODO GRATUITO (default):
 *   Agente A → Gemini 2.0 Flash  (Google AI Studio — gratis)
 *   Agente B → Llama 3.3 70B     (Groq — gratis con límites)
 *
 * MODO PAGO (opcional, configurable en .env):
 *   Agente A → Claude Sonnet      (Anthropic API — pago)
 *   Agente B → Gemini Flash       (Google AI Studio — gratis)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import Anthropic from "@anthropic-ai/sdk";
import * as readline from "readline";
import * as dotenv from "dotenv";

dotenv.config();

// ─── Config ─────────────────────────────────────────────────────────────────

/**
 * Pon PAID_MODE=true en tu .env para usar Claude+Gemini (de pago).
 * Por defecto usa Gemini+Groq (gratis).
 */
const PAID_MODE = process.env.PAID_MODE === "true";

// ─── Clients ─────────────────────────────────────────────────────────────────

const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const groqClient = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const anthropicClient = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// ─── Agent interface ─────────────────────────────────────────────────────────

interface Agent {
  name: string;
  icon: string;
  ask: (systemPrompt: string, history: Message[]) => Promise<string>;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

// ─── Agent implementations ────────────────────────────────────────────────────

function makeGeminiAgent(): Agent {
  if (!geminiClient) throw new Error("GEMINI_API_KEY no está configurado en .env");
  const model = geminiClient.getGenerativeModel({ model: "gemini-2.0-flash" });

  return {
    name: "Gemini 2.0 Flash",
    icon: "🟢",
    async ask(system, history) {
      // Build a single prompt with full history
      const parts = [system, ""];
      for (const msg of history) {
        parts.push(msg.role === "user" ? `Usuario: ${msg.content}` : `Tú: ${msg.content}`);
      }
      const result = await model.generateContent(parts.join("\n\n"));
      return result.response.text().trim();
    },
  };
}

function makeGroqAgent(): Agent {
  if (!groqClient) throw new Error("GROQ_API_KEY no está configurado en .env");

  return {
    name: "Llama 3.3 70B (Groq)",
    icon: "🟣",
    async ask(system, history) {
      const response = await groqClient.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: system },
          ...history,
        ],
        max_tokens: 1024,
        temperature: 0.7,
      });
      return response.choices[0].message.content?.trim() ?? "";
    },
  };
}

function makeClaudeAgent(): Agent {
  if (!anthropicClient) throw new Error("ANTHROPIC_API_KEY no está configurado en .env");

  return {
    name: "Claude Sonnet",
    icon: "🔵",
    async ask(system, history) {
      const response = await anthropicClient.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system,
        messages: history,
      });
      return (response.content[0] as { type: "text"; text: string }).text.trim();
    },
  };
}

// ─── Agent factory ────────────────────────────────────────────────────────────

function buildAgents(): [Agent, Agent] {
  if (PAID_MODE) {
    console.log("💳 Modo: PAGO (Claude + Gemini)\n");
    return [makeClaudeAgent(), makeGeminiAgent()];
  }
  console.log("🆓 Modo: GRATUITO (Gemini + Groq/Llama)\n");
  return [makeGeminiAgent(), makeGroqAgent()];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const line = (c = "─", n = 62) => c.repeat(n);

function header(text: string) {
  console.log(`\n${line("═")}`);
  console.log(`  ${text}`);
  console.log(line("═"));
}

function printAgent(icon: string, name: string, text: string) {
  console.log(`\n${icon} ${name.toUpperCase()}:\n${text}`);
}

// ─── Debate engine ────────────────────────────────────────────────────────────

async function debate(agentA: Agent, agentB: Agent, question: string, rounds: number) {
  header(`DEBATE: ${agentA.name} vs ${agentB.name}`);
  console.log(`📌 Tema  : ${question}`);
  console.log(`🔄 Rondas: ${rounds}`);

  const systemTemplate = (opponentName: string) =>
    `Estás en un debate académico contra ${opponentName}.
Analiza el tema con rigor, defiende tu postura con argumentos concretos.
Si el otro agente tiene un punto válido, reconócelo honestamente.
Sé conciso: máximo 150 palabras por turno.
En el último turno, busca consenso.`;

  const historyA: Message[] = [];
  const historyB: Message[] = [];

  let lastA = "";
  let lastB = "";

  for (let r = 1; r <= rounds; r++) {
    console.log(`\n${line()}`);
    console.log(`  RONDA ${r} / ${rounds}`);
    console.log(line());

    // Build user message for each agent
    const inputA =
      r === 1
        ? `Tema del debate: "${question}"\n\nDa tu postura inicial.`
        : `${agentB.name} respondió:\n"${lastB}"\n\n¿Cuál es tu respuesta?`;

    const inputB =
      r === 1
        ? `Tema del debate: "${question}"\n\nDa tu postura inicial.`
        : `${agentA.name} respondió:\n"${lastA}"\n\n¿Cuál es tu respuesta?`;

    historyA.push({ role: "user", content: inputA });
    historyB.push({ role: "user", content: inputB });

    process.stdout.write(`\n  ⏳ ${agentA.name}...`);
    lastA = await agentA.ask(systemTemplate(agentB.name), historyA);
    historyA.push({ role: "assistant", content: lastA });
    process.stdout.write(" ✓\n");

    process.stdout.write(`  ⏳ ${agentB.name}...`);
    lastB = await agentB.ask(systemTemplate(agentA.name), historyB);
    historyB.push({ role: "assistant", content: lastB });
    process.stdout.write(" ✓\n");

    printAgent(agentA.icon, agentA.name, lastA);
    printAgent(agentB.icon, agentB.name, lastB);
  }

  // ─── Synthesis ──────────────────────────────────────────────────────────────

  header("SÍNTESIS FINAL");

  const synthQ =
    "El debate ha terminado. Resume en 3-5 puntos:\n" +
    "1. ¿En qué coincidieron?\n" +
    "2. ¿Cuáles fueron las diferencias clave?\n" +
    "3. ¿Cuál es la conclusión más sólida?";

  historyA.push({ role: "user", content: synthQ });
  historyB.push({ role: "user", content: synthQ });

  process.stdout.write(`\n  ⏳ Síntesis de ${agentA.name}...`);
  const finalA = await agentA.ask(systemTemplate(agentB.name), historyA);
  process.stdout.write(" ✓\n");

  process.stdout.write(`  ⏳ Síntesis de ${agentB.name}...`);
  const finalB = await agentB.ask(systemTemplate(agentA.name), historyB);
  process.stdout.write(" ✓\n");

  printAgent(agentA.icon, agentA.name, finalA);
  printAgent(agentB.icon, agentB.name, finalB);

  console.log(`\n${line("═")}\n`);
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

async function main() {
  header("ORQUESTADOR DE DEBATE MULTI-AGENTE");

  let agentA: Agent, agentB: Agent;
  try {
    [agentA, agentB] = buildAgents();
  } catch (e: any) {
    console.error(`\n❌ ${e.message}`);
    console.error("   Revisa tu archivo .env\n");
    process.exit(1);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string) => new Promise<string>((res) => rl.question(q, res));

  const question = await ask("💬 ¿Sobre qué quieres que debatan?\n> ");
  const roundsRaw = await ask("🔄 ¿Cuántas rondas? (Enter = 3)\n> ");
  const rounds = Math.max(1, parseInt(roundsRaw) || 3);
  rl.close();

  try {
    await debate(agentA, agentB, question.trim(), rounds);
  } catch (err: any) {
    console.error(`\n❌ Error: ${err.message}`);
    process.exit(1);
  }
}

main();
