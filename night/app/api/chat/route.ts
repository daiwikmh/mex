import { SEED_GRAPH } from "@/lib/kg/seed";
import type { KgNode } from "@/lib/kg/types";
import { NextRequest, NextResponse } from "next/server";

interface ChatBody {
  question: string;
  agentId?: string;
  connectedSources?: string[];
  history?: { role: "user" | "assistant"; content: string }[];
}

function scoreNode(node: KgNode, terms: string[]): number {
  if (node.private) return -1;
  const text = [
    node.label,
    node.type,
    ...Object.values(node.attrs ?? {}).map(String),
  ]
    .join(" ")
    .toLowerCase();
  return terms.reduce((s, t) => s + (text.includes(t) ? 1 : 0), 0);
}

function findRelevantNodes(question: string, sources: string[]): KgNode[] {
  const terms = question
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 2);

  const candidates = SEED_GRAPH.nodes.filter((n) => {
    if (n.private) return false;
    if (sources.length > 0 && n.source && !sources.includes(n.source)) return false;
    return true;
  });

  return candidates
    .map((n) => ({ n, score: scoreNode(n, terms) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ n }) => n);
}

function buildContext(nodes: KgNode[]): string {
  if (nodes.length === 0) {
    const allPublic = SEED_GRAPH.nodes.filter((n) => !n.private).slice(0, 6);
    return allPublic
      .map((n) => {
        const attrs = Object.entries(n.attrs ?? {})
          .map(([k, v]) => `${k}=${v}`)
          .join(", ");
        return `[${n.type}${n.source ? " via " + n.source : ""}] ${n.label}${attrs ? " (" + attrs + ")" : ""}`;
      })
      .join("\n");
  }

  const ids = new Set(nodes.map((n) => n.id));
  const edges = SEED_GRAPH.edges.filter((e) => ids.has(e.from) && ids.has(e.to));

  const nodeLines = nodes.map((n) => {
    const attrs = Object.entries(n.attrs ?? {})
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    return `[${n.type}${n.source ? " via " + n.source : ""}] ${n.label}${attrs ? " (" + attrs + ")" : ""}`;
  });

  const edgeLines = edges.slice(0, 10).map((edge) => {
    const from = SEED_GRAPH.nodes.find((n) => n.id === edge.from)?.label ?? edge.from;
    const to = SEED_GRAPH.nodes.find((n) => n.id === edge.to)?.label ?? edge.to;
    return `${from} --[${edge.type}]--> ${to}`;
  });

  return [...nodeLines, ...edgeLines].join("\n");
}

function templateAnswer(nodes: KgNode[], question: string): string {
  if (nodes.length === 0) {
    return "No data matching your question was found in the connected sources. Try connecting more sources on the Sources page.";
  }
  const first = nodes[0];
  const names = nodes.map((n) => n.label).join(", ");
  const attrs = first.attrs
    ? Object.entries(first.attrs)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ")
    : null;
  return (
    `Found ${nodes.length} relevant item${nodes.length > 1 ? "s" : ""}: ${names}.` +
    (attrs ? ` Key details for ${first.label} — ${attrs}.` : "") +
    " Add your ANTHROPIC_API_KEY to enable full AI-powered answers."
  );
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ChatBody;
  const { question, connectedSources = [], history = [] } = body;

  const relevantNodes = findRelevantNodes(question, connectedSources);
  const context = buildContext(relevantNodes);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      answer: templateAnswer(relevantNodes, question),
      nodeIds: relevantNodes.map((n) => n.id),
    });
  }

  const systemPrompt = `You are an AI assistant for Omnis, a privacy-preserving delegated agent platform on Midnight blockchain. You have access to the user's personal knowledge graph built from their connected data sources (Gmail, Google Calendar, Finance, Google Drive). Answer questions based strictly on the provided context. Be concise and specific. Do not invent data not present in the context. When data is from a specific source, mention it.`;

  const messages = [
    ...history.map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
    {
      role: "user" as const,
      content: `Knowledge graph context:\n${context}\n\nQuestion: ${question}`,
    },
  ];

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json(
      { answer: `API error: ${res.status} ${err}`, nodeIds: [] },
      { status: 500 },
    );
  }

  const data = (await res.json()) as { content?: { text?: string }[] };
  const answer = data.content?.[0]?.text ?? "No response from model.";
  return NextResponse.json({ answer, nodeIds: relevantNodes.map((n) => n.id) });
}
