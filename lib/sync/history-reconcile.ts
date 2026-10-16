import type { HistoryFact, PendingHistoryRequest } from './history-ledger';
export type HistoryDecision =
  'add' | 'replace' | 'remove' | 'same' | 'dirty' | 'conflict';
export function decideHistoryChange(input: {
  owner: string | undefined;
  userId: string;
  localHash: string | null;
  remoteHash: string | null;
  prior: HistoryFact | undefined;
  pending: PendingHistoryRequest | undefined;
}): HistoryDecision {
  const { owner, userId, localHash, remoteHash, prior, pending } = input;
  if (owner && owner !== userId) return 'conflict';
  if (localHash === null) return remoteHash === null ? 'same' : 'add';
  if (remoteHash === localHash) return 'same';
  if (prior && !prior.deleted && !prior.conflict && prior.hash === localHash)
    return remoteHash === null ? 'remove' : 'replace';
  if (
    remoteHash !== null &&
    ((prior &&
      !prior.deleted &&
      !prior.conflict &&
      prior.hash === remoteHash) ||
      pending?.hash === remoteHash)
  )
    return 'dirty';
  return 'conflict';
}
