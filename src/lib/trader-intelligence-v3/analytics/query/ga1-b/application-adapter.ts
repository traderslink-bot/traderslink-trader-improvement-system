import type { ReadOnlySnapshotAuthoritySource } from "../../adapters";
import { createSnapshotTradeQueryDatasetSource, type VerifiedTradeQueryDatasetSource } from "../gateway";

/**
 * GA1-B's application seam intentionally exposes only the accepted snapshot
 * source through GA1-A's read-only gateway source contract. It has no parser,
 * database handle, write capability, or browser-facing surface.
 */
export function createGa1BReadOnlyApplicationAdapter(
  source: ReadOnlySnapshotAuthoritySource,
): VerifiedTradeQueryDatasetSource {
  return createSnapshotTradeQueryDatasetSource(source);
}
