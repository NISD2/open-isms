/**
 * Which requirements a sign-off credits through the satisfaction graph (propagateSatisfaction).
 * Pure, so the walk can be tested without a database.
 */

export interface SatisfactionEdge {
  readonly requirementAId: string;
  readonly requirementBId: string;
  readonly equivalenceKind: "equivalent" | "overlapping";
}

/**
 * Breadth first from `source`: every neighbour is credited, and the walk continues only through
 * `equivalent` edges, so partial (`overlapping`) overlap cannot carry credit any further.
 *
 * Never a requirement in the source's own framework, and never through one: the graph links
 * frameworks to each other, and a walk that leaves through one link can come back through another
 * (NIS 2 2.1 is equivalent to ISO 27001 6.1, which overlaps NIS 2 2.4). Crediting that would sign
 * one NIS 2 item off with another's work. A requirement whose framework is unknown is skipped.
 */
export function satisfactionTargets(
  edges: readonly SatisfactionEdge[],
  source: string,
  frameworkOf: (requirementId: string) => string | undefined,
): string[] {
  const home = frameworkOf(source);
  if (!home) return [];

  const adjacency = new Map<
    string,
    Array<{ neighbor: string; kind: SatisfactionEdge["equivalenceKind"] }>
  >();
  for (const edge of edges) {
    adjacency.set(edge.requirementAId, [
      ...(adjacency.get(edge.requirementAId) ?? []),
      { neighbor: edge.requirementBId, kind: edge.equivalenceKind },
    ]);
    adjacency.set(edge.requirementBId, [
      ...(adjacency.get(edge.requirementBId) ?? []),
      { neighbor: edge.requirementAId, kind: edge.equivalenceKind },
    ]);
  }

  const visited = new Set<string>([source]);
  const credited: string[] = [];
  const queue: string[] = [source];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    for (const { neighbor, kind } of adjacency.get(current) ?? []) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      const framework = frameworkOf(neighbor);
      if (!framework || framework === home) continue;
      credited.push(neighbor);
      if (kind === "equivalent") queue.push(neighbor);
    }
  }

  return credited;
}
