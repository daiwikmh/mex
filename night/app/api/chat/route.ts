import type { KgNode, KgEdge } from "@/lib/kg/types";
import { NextRequest, NextResponse } from "next/server";

interface ChatBody {
  question: string;
  agentId?: string;
  connectedSources?: string[];
  liveNodes?: KgNode[];
  liveEdges?: KgEdge[];
  history?: { role: "user" | "assistant"; content: string }[];
}

const OG_URL   = process.env.OG_INFERENCE_URL   ?? "https://router-api-testnet.integratenetwork.work/v1";
const OG_MODEL = process.env.OG_INFERENCE_MODEL ?? "qwen/qwen-2.5-7b-instruct";

function score(node: KgNode, terms: string[]): number {
  const text = [node.label, node.type, ...Object.values(node.attrs ?? {}).map(String)]
    .join(" ")
    .toLowerCase();
  return terms.reduce((s, t) => s + (text.includes(t) ? 1 : 0), 0);
}

function findRelevant(nodes: KgNode[], question: string): KgNode[] {
  const terms = question
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 2);
  const scored = nodes.map((n) => ({ n, s: score(n, terms) }));
  const hits = scored.filter(({ s }) => s > 0).sort((a, b) => b.s - a.s);
  return (hits.length > 0 ? hits : scored).slice(0, 10).map(({ n }) => n);
}

function buildContext(nodes: KgNode[], edges: KgEdge[]): string {
  const ids = new Set(nodes.map((n) => n.id));
  const relevant = edges.filter((e) => ids.has(e.from) && ids.has(e.to));
  const nodeLines = nodes.map((n) => {
    const attrs = Object.entries(n.attrs ?? {}).map(([k, v]) => `${k}=${v}`).join(", ");
    return `[${n.type}${n.source ? " / " + n.source : ""}] ${n.label}${attrs ? " (" + attrs + ")" : ""}`;
  });
  const edgeLines = relevant.slice(0, 12).map((edge) => {
    const from = nodes.find((n) => n.id === edge.from)?.label ?? edge.from;
    const to   = nodes.find((n) => n.id === edge.to)?.label   ?? edge.to;
    return `${from} --[${edge.type}]--> ${to}`;
  });
  return [...nodeLines, ...edgeLines].join("\n");
}

async function callOg(
  messages: { role: string; content: string }[],
  apiKey: string,
): Promise<string> {
  const res = await fetch(`${OG_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OG_MODEL,
      messages,
      temperature: 0.4,
      max_tokens: 500,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`0G inference ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() ?? "No response.";
}

async function callAnthropic(
  messages: { role: "user" | "assistant"; content: string }[],
  system: string,
  apiKey: string,
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system,
      messages,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = (await res.json()) as { content?: { text?: string }[] };
  return data.content?.[0]?.text?.trim() ?? "No response.";
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ChatBody;
  const {
    question,
    liveNodes = [],
    liveEdges = [],
    connectedSources = [],
    history = [],
  } = body;

  const pool = liveNodes.filter(
    (n) =>
      !n.private &&
      (connectedSources.length === 0 || !n.source || connectedSources.includes(n.source)),
  );

  const relevant = findRelevant(pool, question);
  const context =
    pool.length > 0
      ? buildContext(relevant, liveEdges)
      : "No data sources connected.";

  const system =
    "You are an AI assistant for Omnis, a privacy-preserving delegated agent platform on Midnight blockchain. " +
    "You have access to the user's personal knowledge graph built from their connected sources (Gmail, Google Calendar). " +
    "Answer based strictly on the provided context — do not invent data not present. Be concise and specific.";

  const historyMessages = history
    .slice(-6)
    .map((h) => ({ role: h.role, content: h.content }));

  const userContent =
    `Knowledge graph context (${pool.length} nodes):\n${context}\n\nQuestion: ${question}`;

  const ogKey        = process.env.OG_INFERENCE_API;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!ogKey && !anthropicKey) {
    const answer =
      relevant.length > 0
        ? `Found ${relevant.length} item${relevant.length > 1 ? "s" : ""}: ${relevant.map((n) => n.label).join(", ")}.` +
          (relevant[0]?.attrs
            ? ` ${relevant[0].label}: ${Object.entries(relevant[0].attrs).map(([k, v]) => `${k}=${v}`).join(", ")}.`
            : "") +
          " Set OG_INFERENCE_API for full answers."
        : pool.length === 0
        ? "Connect a source on the Sources page first."
        : "No matching data found.";
    return NextResponse.json({ answer, nodeIds: relevant.map((n) => n.id) });
  }

  try {
    let answer: string;

    if (ogKey) {
      const messages = [
        { role: "system", content: system },
        ...historyMessages,
        { role: "user", content: userContent },
      ];
      answer = await callOg(messages, ogKey);
    } else {
      const messages = [
        ...historyMessages,
        { role: "user" as const, content: userContent },
      ];
      answer = await callAnthropic(messages, system, anthropicKey!);
    }

    return NextResponse.json({ answer, nodeIds: relevant.map((n) => n.id) });
  } catch (e) {
    return NextResponse.json(
      { answer: `Inference error: ${(e as Error).message}`, nodeIds: [] },
      { status: 500 },
    );
  }
}
