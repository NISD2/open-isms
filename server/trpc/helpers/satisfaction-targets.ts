/**
 * Which requirements a sign-off credits through the satisfaction graph (propagateSatisfaction).
 * Pure, so the walk and the credit rule can be tested without a database.
 */

import { DONE_STATUSES } from "@/lib/compliance/journey-position";
import { signerMeetsRequiredRole } from "@/lib/compliance/signer-role";

export interface CreditTarget {
  readonly status: string;
  readonly requiredSignOffRole: string | null;
  /** Its own assigned signers still owe a signature. */
  readonly rostered: boolean;
}

/**
 * Whether a target the walk reached takes the credit. Not when it is already signed, approved or
 * set aside, since credit writes over none of those; not when its assigned signers owe a signature,
 * since it is theirs to sign; and only when the source's signer could have signed it directly.
 */
export function takesCredit(target: CreditTarget, signedOffRole: string): boolean {
  return (
    !DONE_STATUSES.has(target.status) &&
    !target.rostered &&
    signerMeetsRequiredRole({
      signerRole: signedOffRole,
      requiredSignOffRole: target.requiredSignOffRole,
    })
  );
}

export interface SatisfactionEdge {
  readonly requirementAId: string;
  readonly requirementBId: string;
  readonly equivalenceKind: "equivalent" | "overlapping";
}

/**
 * Breadth first from `source`, through `equivalent` edges only. Those link the same record, which
 * one signature covers in every framework that keeps it. An `overlapping` edge is a partial
 * overlap with a gap the other framework still asks for: it credits nothing (Simon, 19.10.2026:
 * a partial overlap is a hint with its gap, never a signature).
 *
 * Never a requirement in the source's own framework, and never through one: the graph links
 * frameworks to each other, and a walk that leaves through one link can come back through another
 * (NIS 2 2.1 is equivalent to ISO 27001 6.1, which is equivalent to another NIS 2 item). Crediting
 * that would sign one NIS 2 item off with another's work. A requirement whose framework is
 * unknown is skipped.
 */
export function satisfactionTargets(
  edges: readonly SatisfactionEdge[],
  source: string,
  frameworkOf: (requirementId: string) => string | undefined,
): string[] {
  const home = frameworkOf(source);
  if (!home) return [];

  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.equivalenceKind !== "equivalent") continue;
    adjacency.set(edge.requirementAId, [
      ...(adjacency.get(edge.requirementAId) ?? []),
      edge.requirementBId,
    ]);
    adjacency.set(edge.requirementBId, [
      ...(adjacency.get(edge.requirementBId) ?? []),
      edge.requirementAId,
    ]);
  }

  const visited = new Set<string>([source]);
  const credited: string[] = [];
  const queue: string[] = [source];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    for (const neighbor of adjacency.get(current) ?? []) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      const framework = frameworkOf(neighbor);
      if (!framework || framework === home) continue;
      credited.push(neighbor);
      queue.push(neighbor);
    }
  }

  return credited;
}
