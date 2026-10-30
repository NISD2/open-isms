import { describe, expect, mock, test } from "bun:test";
import type { SignOffSnapshotData } from "@nisd2/isms-schema/tables/sign-off-history";
import { computeChainedChecksum, verifySignOffChain } from "@nisd2/isms-trpc/audit";
import type { DbOrTx } from "@/lib/db";
import { formatSigner } from "@/lib/pdf/format";
import { latestSignOffSnapshots, recordSignOffChainEntry } from "./sign-off-chain";

// Stub signedWording to return deterministic wording without touching translation catalogs
mock.module("./signed-wording", () => ({
  signedWording: async () => ({
    code: "2.1",
    locale: "de",
    title: "Leitlinie zur Informationssicherheit",
    description: "Beschreibung",
    legalRef: "§ 30 BSIG",
    frameworkRef: "Art. 21(2)(a)",
    cirReference: null,
  }),
}));

interface InsertedHistoryRow {
  statusId: string;
  signedOffBy: string;
  signedOffRole: string;
  snapshot: SignOffSnapshotData;
  checksum: string;
  version: number;
}

describe("sign-off display name snapshot", () => {
  test("snapshots signer display name explicitly provided in params", async () => {
    const insertedRows: InsertedHistoryRow[] = [];

    const mockDb = {
      query: {
        evidence: {
          findMany: async () => [],
        },
        user: {
          findFirst: async () => ({ name: "Live User Name" }),
        },
      },
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: () => ({
              limit: async () => [],
            }),
          }),
        }),
      }),
      insert: () => ({
        values: async (row: InsertedHistoryRow) => {
          insertedRows.push(row);
          return [row];
        },
      }),
    };

    await recordSignOffChainEntry(mockDb as unknown as DbOrTx, {
      companyId: "comp-1",
      statusId: "status-1",
      requirementId: "req-1",
      signedOffBy: "user-1",
      signedOffRole: "ciso",
      signerName: "Dr. Alice Snapshot",
      source: "editor",
      templateVersion: 1,
      companyProfile: {},
    });

    expect(insertedRows).toHaveLength(1);
    const row = insertedRows[0];
    expect(row).toBeDefined();
    if (!row) throw new Error("Row was not inserted");
    expect(row.snapshot.signerName).toBe("Dr. Alice Snapshot");
    expect(row.version).toBe(1);

    // Checksum verified against the snapshot holding signerName
    const expectedChecksum = computeChainedChecksum({
      statusId: "status-1",
      version: 1,
      signedOffBy: "user-1",
      snapshot: row.snapshot,
      previousChecksum: null,
    });
    expect(row.checksum).toBe(expectedChecksum);
  });

  test("snapshots signer display name looked up from user table when not in params", async () => {
    const insertedRows: InsertedHistoryRow[] = [];

    const mockDb = {
      query: {
        evidence: {
          findMany: async () => [],
        },
        user: {
          findFirst: async () => ({ name: "Bob Signer" }),
        },
      },
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: () => ({
              limit: async () => [],
            }),
          }),
        }),
      }),
      insert: () => ({
        values: async (row: InsertedHistoryRow) => {
          insertedRows.push(row);
          return [row];
        },
      }),
    };

    await recordSignOffChainEntry(mockDb as unknown as DbOrTx, {
      companyId: "comp-1",
      statusId: "status-2",
      requirementId: "req-1",
      signedOffBy: "user-bob",
      signedOffRole: "Geschäftsführung",
      source: "module",
      templateVersion: 2,
      companyProfile: {},
    });

    expect(insertedRows).toHaveLength(1);
    const row = insertedRows[0];
    expect(row).toBeDefined();
    if (!row) throw new Error("Row was not inserted");
    expect(row.snapshot.signerName).toBe("Bob Signer");
  });

  test("historical display retains snapshotted name when user profile name subsequently changes", async () => {
    // 1. Sign-off recorded with original profile name "Clara Original"
    const originalSnapshot: SignOffSnapshotData = {
      source: "editor",
      templateVersion: 1,
      companyProfile: {},
      data: {},
      evidenceRefs: [],
      signerName: "Clara Original",
    };

    const storedRows = [
      {
        id: "history-1",
        statusId: "status-clara",
        version: 1,
        signedOffBy: "user-clara",
        signedOffRole: "Geschäftsführung",
        snapshot: originalSnapshot,
      },
    ];

    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: () => storedRows,
          }),
        }),
      }),
    };

    // User's name is later updated in user profile to "Clara Renamed"
    const updatedUserProfile = { id: "user-clara", name: "Clara Renamed" };
    expect(updatedUserProfile.name).toBe("Clara Renamed");

    // Historical records must display the stored snapshot, NOT the live profile name
    const snapshots = await latestSignOffSnapshots(mockDb as unknown as DbOrTx, [
      "status-clara",
    ]);
    const historicalSnapshot = snapshots.get("status-clara");

    expect(historicalSnapshot?.signerName).toBe("Clara Original");
    expect(historicalSnapshot?.signerName).not.toBe(updatedUserProfile.name);

    // Formatted attribution shows snapshotted name with role
    const displayed = formatSigner(
      historicalSnapshot?.signerName ?? null,
      "Geschäftsführung",
    );
    expect(displayed).toBe("Clara Original (Geschäftsführung)");
  });

  test("legacy records without snapshot safely fall back to role alone", async () => {
    // A legacy record written before signerName was captured
    const legacySnapshot: SignOffSnapshotData = {
      source: "intake",
      templateVersion: 1,
      companyProfile: {},
      data: {},
      evidenceRefs: [],
    };
    expect(legacySnapshot.signerName).toBeUndefined();

    const storedRows = [
      {
        id: "history-legacy",
        statusId: "status-legacy",
        version: 1,
        signedOffBy: "user-legacy",
        signedOffRole: "ciso",
        snapshot: legacySnapshot,
      },
    ];

    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: () => storedRows,
          }),
        }),
      }),
    };

    const snapshots = await latestSignOffSnapshots(mockDb as unknown as DbOrTx, [
      "status-legacy",
    ]);
    const snapshot = snapshots.get("status-legacy");

    expect(snapshot?.signerName).toBeUndefined();

    // Fallback to role alone
    const displayed = formatSigner(snapshot?.signerName ?? null, "ciso");
    expect(displayed).toBe("ciso");

    // Legacy checksum verification passes
    const legacyChecksum = computeChainedChecksum({
      statusId: "status-legacy",
      version: 1,
      signedOffBy: "user-legacy",
      snapshot: legacySnapshot,
      previousChecksum: null,
    });

    const chainDb = {
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: () => [
              {
                statusId: "status-legacy",
                version: 1,
                signedOffBy: "user-legacy",
                snapshot: legacySnapshot,
                previousChecksum: null,
                checksum: legacyChecksum,
              },
            ],
          }),
        }),
      }),
    };

    const verification = await verifySignOffChain(
      chainDb as unknown as DbOrTx,
      "status-legacy",
    );
    expect(verification.valid).toBe(true);
  });

  test("returns the newest version when a requirement has multiple sign-off history entries", async () => {
    const v1Snapshot: SignOffSnapshotData = {
      source: "editor",
      templateVersion: 1,
      companyProfile: {},
      data: {},
      evidenceRefs: [],
      signerName: "First Signer",
    };
    const v2Snapshot: SignOffSnapshotData = {
      source: "editor",
      templateVersion: 2,
      companyProfile: {},
      data: {},
      evidenceRefs: [],
      signerName: "Second Signer",
    };

    // DB returns ordered by desc(version)
    const storedRows = [
      { statusId: "status-multi", snapshot: v2Snapshot, version: 2 },
      { statusId: "status-multi", snapshot: v1Snapshot, version: 1 },
    ];

    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: () => storedRows,
          }),
        }),
      }),
    };

    const snapshots = await latestSignOffSnapshots(mockDb as unknown as DbOrTx, [
      "status-multi",
    ]);
    expect(snapshots.get("status-multi")?.signerName).toBe("Second Signer");
  });
});
