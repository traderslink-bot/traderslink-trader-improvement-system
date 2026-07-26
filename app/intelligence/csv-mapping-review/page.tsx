import { buildSampleWorkspaceContext } from "@/src/lib/trader-analytics/product/productization";
import CsvMappingReviewClient from "./csv-mapping-review-client";

export default function CsvMappingReviewPage() {
  const { account } = buildSampleWorkspaceContext({
    userId: "sample-user",
    accountId: "sample-account",
  });

  return (
    <CsvMappingReviewClient
      accountLabel={account.label}
      accountTimezone={account.timezone}
      importDefaultTimezone={account.importDefaults.timestampTimezone}
    />
  );
}
