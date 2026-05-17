import type { KgEdge, KgNode, KnowledgeGraph } from "./types";
import { edgeInScope, nodeInScope, sha256Hex, type KgScope } from "./scope";

export interface TraversalStep {
  fromNodeId: string | null;
  edgeId: string | null;
  nodeId: string;
  depth: number;
  allowed: boolean;
  blockedReason?: string;
}

export interface TraversalResult {
  visitedNodeIds: string[];
  visitedEdgeIds: string[];
  steps: TraversalStep[];
  aborted: boolean;
  abortReason: string | null;
  queryHash: string;
  resultCommitment: string;
}

export interface TraversalRequest {
  seedNodeId: string;
  pattern: string;
}

export async function runTraversal(
  graph: KnowledgeGraph,
  scope: KgScope,
  req: TraversalRequest,
): Promise<TraversalResult> {
  const startNode = graph.nodes.find((x) => x.id === req.seedNodeId);
  const steps: TraversalStep[] = [];
  const visitedNodes = new Set<string>();
  const visitedEdges = new Set<string>();
  let aborted = false;
  let abortReason: string | null = null;

  if (!startNode) {
    aborted = true;
    abortReason = `Seed node ${req.seedNodeId} not found`;
  } else if (!nodeInScope(startNode.type, scope)) {
    steps.push({
      fromNodeId: null,
      edgeId: null,
      nodeId: startNode.id,
      depth: 0,
      allowed: false,
      blockedReason: `Seed node type ${startNode.type} not in scope`,
    });
    aborted = true;
    abortReason = `Seed type ${startNode.type} out of scope`;
  } else {
    visitedNodes.add(startNode.id);
    steps.push({
      fromNodeId: null,
      edgeId: null,
      nodeId: startNode.id,
      depth: 0,
      allowed: true,
    });

    const queue: Array<{ id: string; depth: number }> = [
      { id: startNode.id, depth: 0 },
    ];
    while (queue.length > 0 && !aborted) {
      const current = queue.shift()!;
      if (current.depth >= scope.maxDepth) continue;

      const outgoing: KgEdge[] = graph.edges.filter(
        (x) => x.from === current.id || x.to === current.id,
      );
      for (const edge of outgoing) {
        const otherId = edge.from === current.id ? edge.to : edge.from;
        const other: KgNode | undefined = graph.nodes.find((x) => x.id === otherId);
        if (!other) continue;

        const edgeOk = edgeInScope(edge.type, scope);
        const nodeOk = nodeInScope(other.type, scope);

        if (!edgeOk) {
          steps.push({
            fromNodeId: current.id,
            edgeId: edge.id,
            nodeId: other.id,
            depth: current.depth + 1,
            allowed: false,
            blockedReason: `Edge type ${edge.type} not in scope`,
          });
          continue;
        }
        if (!nodeOk) {
          steps.push({
            fromNodeId: current.id,
            edgeId: edge.id,
            nodeId: other.id,
            depth: current.depth + 1,
            allowed: false,
            blockedReason: `Node type ${other.type} not in scope`,
          });
          continue;
        }
        if (visitedNodes.has(other.id)) continue;

        visitedNodes.add(other.id);
        visitedEdges.add(edge.id);
        steps.push({
          fromNodeId: current.id,
          edgeId: edge.id,
          nodeId: other.id,
          depth: current.depth + 1,
          allowed: true,
        });
        queue.push({ id: other.id, depth: current.depth + 1 });
      }
    }
  }

  const queryHash = await sha256Hex(
    `q|${req.seedNodeId}|${req.pattern}|${Date.now()}`,
  );
  const subgraphCanonical = [...visitedNodes].sort().join(",") + "|" +
    [...visitedEdges].sort().join(",");
  const resultCommitment = await sha256Hex(`r|${subgraphCanonical}`);

  return {
    visitedNodeIds: [...visitedNodes],
    visitedEdgeIds: [...visitedEdges],
    steps,
    aborted,
    abortReason,
    queryHash,
    resultCommitment,
  };
}

export const QUERY_PATTERNS = [
  { id: "invoices-from-emails", label: "Find invoices attached to inbound emails", seedHint: "e1" },
  { id: "billing-from-contacts", label: "Trace charges back through invoices",      seedHint: "ch1" },
  { id: "meeting-mentions",      label: "List invoices mentioned in meetings",       seedHint: "m1" },
  { id: "vendor-graph",          label: "Map a vendor's full footprint",             seedHint: "c4" },
];
