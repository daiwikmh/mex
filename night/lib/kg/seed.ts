import type { KnowledgeGraph, KgNode, KgEdge } from "./types";

const n = (
  id: string,
  type: KgNode["type"],
  label: string,
  attrs?: KgNode["attrs"],
  priv = false,
  source?: KgNode["source"],
): KgNode => ({ id, type, label, attrs, private: priv, source });

const e = (
  id: string,
  type: KgEdge["type"],
  from: string,
  to: string,
): KgEdge => ({ id, type, from, to });

const nodes: KgNode[] = [
  n("c1", "Contact", "Sarah Chen",         { role: "CFO",         org: "Acme Corp" }),
  n("c2", "Contact", "Marcus Reid",        { role: "Partner",     org: "Lyra LLP" }),
  n("c3", "Contact", "You",                { role: "Owner",       org: "" }),
  n("c4", "Contact", "Priya Shah",         { role: "Vendor lead", org: "Halcyon" }),
  n("c5", "Contact", "billing@stripe.com", { role: "System",      org: "Stripe" }),

  n("e1", "Email", "Q4 invoice review",      { date: "2026-05-12", subject: "invoice" },     false, "gmail"),
  n("e2", "Email", "Halcyon vendor agreement",{ date: "2026-05-10", subject: "vendor" },     false, "gmail"),
  n("e3", "Email", "Re: Q4 invoice review",  { date: "2026-05-13", subject: "invoice" },     false, "gmail"),
  n("e4", "Email", "Stripe payment receipt", { date: "2026-05-08", subject: "receipt" },     false, "gmail"),
  n("e5", "Email", "Acme service renewal",   { date: "2026-05-14", subject: "renewal" },     false, "gmail"),
  n("e6", "Email", "Lyra retainer Q1",       { date: "2026-05-06", subject: "retainer" },    false, "gmail"),
  n("e7", "Email", "Halcyon renewal",        { date: "2026-05-15", subject: "renewal" },     false, "gmail"),
  n("e8", "Email", "Personal: dinner thursday",{ date: "2026-05-16" }, true, "gmail"),

  n("i1", "Invoice", "INV-2487", { amount: 12500, due: "2026-06-01", status: "open" },     false, "finance"),
  n("i2", "Invoice", "INV-2488", { amount: 8500,  due: "2026-06-14", status: "open" },     false, "finance"),
  n("i3", "Invoice", "INV-2490", { amount: 12500, due: "2026-07-01", status: "open" },     false, "finance"),
  n("i4", "Invoice", "INV-9001", { amount: 4500,  due: "2026-05-30", status: "open" },     false, "finance"),
  n("i5", "Invoice", "INV-2502", { amount: 18000, due: "2026-07-12", status: "pending" },  false, "finance"),

  n("ch1", "Charge", "ch_3aB", { amount: 12500, status: "paid" },   false, "finance"),
  n("ch2", "Charge", "ch_3xY", { amount: 8500,  status: "paid" },   false, "finance"),
  n("ch3", "Charge", "ch_3pK", { amount: 4500,  status: "paid" },   false, "finance"),
  n("ch4", "Charge", "ch_3qM", { amount: 12500, status: "failed" }, false, "finance"),

  n("m1", "Meeting", "Quarterly billing review",  { start: "2026-05-19T14:00", attendees: "3" }, false, "calendar"),
  n("m2", "Meeting", "Lyra Q1 kickoff",           { start: "2026-05-21T10:00", attendees: "2" }, false, "calendar"),
  n("m3", "Meeting", "Halcyon renewal",           { start: "2026-05-24T15:30", attendees: "2" }, false, "calendar"),
  n("m4", "Meeting", "Personal: physio",          { start: "2026-05-20T08:00" }, true, "calendar"),

  n("d1", "Document", "Acme MSA v3",               { pages: 24, type: "contract" }, false, "drive"),
  n("d2", "Document", "Halcyon SOW",               { pages: 12, type: "contract" }, false, "drive"),
  n("d3", "Document", "Lyra retainer agreement",   { pages: 8,  type: "contract" }, false, "drive"),
  n("d4", "Document", "Personal: tax notes",       { pages: 3 }, true, "drive"),
];

const edges: KgEdge[] = [
  e("se-e1", "sent_by", "e1", "c1"),
  e("st-e1", "sent_to", "e1", "c3"),
  e("se-e2", "sent_by", "e2", "c4"),
  e("st-e2", "sent_to", "e2", "c3"),
  e("se-e3", "sent_by", "e3", "c3"),
  e("st-e3", "sent_to", "e3", "c1"),
  e("fu-e3", "follows_up", "e3", "e1"),
  e("se-e4", "sent_by", "e4", "c5"),
  e("st-e4", "sent_to", "e4", "c3"),
  e("se-e5", "sent_by", "e5", "c1"),
  e("st-e5", "sent_to", "e5", "c3"),
  e("se-e6", "sent_by", "e6", "c2"),
  e("st-e6", "sent_to", "e6", "c3"),
  e("se-e7", "sent_by", "e7", "c4"),
  e("st-e7", "sent_to", "e7", "c3"),
  e("se-e8", "sent_by", "e8", "c1"),
  e("st-e8", "sent_to", "e8", "c3"),

  e("at-i1", "attached_to", "i1", "e1"),
  e("at-i2", "attached_to", "i2", "e2"),
  e("at-i3", "attached_to", "i3", "e5"),
  e("at-i4", "attached_to", "i4", "e6"),
  e("at-i5", "attached_to", "i5", "e7"),

  e("cf-ch1", "charged_for", "ch1", "i1"),
  e("cf-ch2", "charged_for", "ch2", "i2"),
  e("cf-ch3", "charged_for", "ch3", "i4"),
  e("at-ch4", "attached_to", "ch4", "e4"),
  e("pa-ch1", "paid", "ch1", "c1"),
  e("pa-ch2", "paid", "ch2", "c4"),
  e("pa-ch3", "paid", "ch3", "c2"),

  e("ab-m1-c1", "attended_by", "m1", "c1"),
  e("ab-m1-c3", "attended_by", "m1", "c3"),
  e("ab-m2-c2", "attended_by", "m2", "c2"),
  e("ab-m2-c3", "attended_by", "m2", "c3"),
  e("ab-m3-c4", "attended_by", "m3", "c4"),
  e("ab-m3-c3", "attended_by", "m3", "c3"),
  e("ab-m4-c3", "attended_by", "m4", "c3"),
  e("mn-m1-i1", "mentions", "m1", "i1"),
  e("mn-m3-i5", "mentions", "m3", "i5"),

  e("mn-d1-c1", "mentions", "d1", "c1"),
  e("mn-d2-c4", "mentions", "d2", "c4"),
  e("mn-d2-i5", "mentions", "d2", "i5"),
  e("mn-d3-c2", "mentions", "d3", "c2"),
  e("mn-d3-i4", "mentions", "d3", "i4"),
  e("mn-d4-c3", "mentions", "d4", "c3"),
];

export const SEED_GRAPH: KnowledgeGraph = { nodes, edges };

export function getNode(id: string): KgNode | undefined {
  return SEED_GRAPH.nodes.find((x) => x.id === id);
}

export function outgoingEdges(id: string): KgEdge[] {
  return SEED_GRAPH.edges.filter((x) => x.from === id);
}

export function neighborEdges(id: string): KgEdge[] {
  return SEED_GRAPH.edges.filter((x) => x.from === id || x.to === id);
}
