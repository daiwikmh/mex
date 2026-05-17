export type NodeType =
  | "Email"
  | "Invoice"
  | "Contact"
  | "Meeting"
  | "Charge"
  | "Document";

export type EdgeType =
  | "sent_by"
  | "sent_to"
  | "attached_to"
  | "attended_by"
  | "charged_for"
  | "mentions"
  | "follows_up"
  | "paid";

export type SourceType = "gmail" | "calendar" | "finance" | "drive";

export interface KgNode {
  id: string;
  type: NodeType;
  label: string;
  attrs?: Record<string, string | number>;
  private?: boolean;
  source?: SourceType;
}

export interface KgEdge {
  id: string;
  type: EdgeType;
  from: string;
  to: string;
}

export interface KnowledgeGraph {
  nodes: KgNode[];
  edges: KgEdge[];
}

export const ALL_NODE_TYPES: NodeType[] = [
  "Email",
  "Invoice",
  "Contact",
  "Meeting",
  "Charge",
  "Document",
];

export const ALL_EDGE_TYPES: EdgeType[] = [
  "sent_by",
  "sent_to",
  "attached_to",
  "attended_by",
  "charged_for",
  "mentions",
  "follows_up",
  "paid",
];
