/**
 * Tearing a company down used to delete its rows and leave every file they
 * pointed at in the bucket, training certificates with employees' names
 * included, while the certificate said everything was gone. These cases pin
 * which files a teardown deletes, which it must never touch, that a failure
 * after the commit is recorded rather than thrown, and that retrying ends.
 */
import { describe, expect, spyOn, test } from "bun:test";
import type { DbOrTx } from "@/lib/db";
import { companyUploadFolders } from "@/lib/storage/object-key";
import {
  company,
  companyCertification,
  evidence,
  policy,
  trainingRecord,
} from "@/schema";
import {
  afterRetryWindow,
  collectCompanyFiles,
  deleteStoredFiles,
  ERASURE_FILE_RETRY_DAYS,
  type FileOutcome,
  type FileStore,
  pendingOutcome,
  type Retry,
  retryFiles,
  settleStoredFiles,
  storedFileState,
} from "./stored-files";

const COMPANY = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

const CERTS = `companies/${COMPANY}/training-certs/`;
const EVIDENCE = `evidence/${COMPANY}/status-1/a1-Pentest_Bericht.pdf`;
const CERTIFICATE = `${CERTS}b2-Zertifikat_Anna_Muster.pdf`;
const CERTIFICATION = `supplier-certifications/${COMPANY}/1759219200000-iso27001.pdf`;
const LOGO = `supplier-profile/${COMPANY}/logo-1759219200000-logo.png`;
/** Replaced long ago: no row points at it, but it is still the company's file. */
const OLD_LOGO = `supplier-profile/${COMPANY}/logo-1700000000000-old.png`;
/** Uploaded and never attached to a certification. */
const ABANDONED = `supplier-certifications/${COMPANY}/1759000000000-draft.pdf`;

const OTHER_TENANT = `evidence/${OTHER}/status-9/c3-theirs.pdf`;
const INVOICE = "billing/account-1/RE-2026-0001.pdf";
/** Written before #222 checked keys: starts in the folder, is company B's file on a store that resolves dot segments. */
const CLIMBING = `${CERTS}../../../evidence/${OTHER}/status-9/c3-theirs.pdf`;

/** A retry that does not sleep, so the bound is visible in call counts. */
const NO_WAIT: Retry = { attempts: 3, wait: async () => {} };

function fakeStore(
  keys: readonly string[],
  fail: { list?: boolean; remove?: string } = {},
) {
  const objects = new Set(keys);
  const calls = { list: 0, remove: new Map<string, number>() };
  const store: FileStore = {
    list: async (prefix) => {
      calls.list += 1;
      if (fail.list) throw new Error("AccessDenied");
      return [...objects].filter((key) => key.startsWith(prefix));
    },
    remove: async (key) => {
      calls.remove.set(key, (calls.remove.get(key) ?? 0) + 1);
      if (key === fail.remove) throw new Error(`AccessDenied on ${key}`);
      objects.delete(key);
    },
  };
  return { store, objects, calls };
}

/** The key columns each table holds for the company, as the erasure transaction reads them. */
function fakeTx(rows: Map<unknown, Array<{ key: string | null }>>) {
  return {
    select: () => ({
      from: (table: unknown) => {
        const builder = {
          innerJoin: () => builder,
          where: async () => rows.get(table) ?? [],
        };
        return builder;
      },
    }),
  } as unknown as DbOrTx;
}

const companyRows = () =>
  new Map<unknown, Array<{ key: string | null }>>([
    [evidence, [{ key: EVIDENCE }]],
    [trainingRecord, [{ key: CERTIFICATE }, { key: CERTIFICATE }, { key: null }]],
    [companyCertification, [{ key: CERTIFICATION }]],
    [policy, [{ key: null }]],
    [company, [{ key: LOGO }]],
  ]);

const companyFiles = () => collectCompanyFiles(fakeTx(companyRows()), COMPANY);

const BUCKET = [
  EVIDENCE,
  CERTIFICATE,
  CERTIFICATION,
  LOGO,
  OLD_LOGO,
  ABANDONED,
  OTHER_TENANT,
  INVOICE,
];

describe("collectCompanyFiles", () => {
  test("reads every key the company's rows hold, and its upload folders", async () => {
    const files = await companyFiles();
    expect([...new Set(files.keys)].sort()).toEqual(
      [EVIDENCE, CERTIFICATE, CERTIFICATION, LOGO].sort(),
    );
    expect(files.prefixes).toEqual(companyUploadFolders(COMPANY));
  });
});

// Written inside the erasure transaction, so a process that dies right after
// the commit still leaves the cron something to retry.
describe("pendingOutcome", () => {
  test("names every folder and every own key, and nothing else", async () => {
    const files = await companyFiles();
    const outcome = pendingOutcome({
      ...files,
      keys: [...files.keys, CLIMBING, INVOICE],
    });
    expect(outcome.state).toBe("pending");
    expect(outcome.pendingPrefixes).toEqual(companyUploadFolders(COMPANY));
    expect(outcome.keys.sort()).toEqual(
      [EVIDENCE, CERTIFICATE, CERTIFICATION, LOGO].sort(),
    );
  });
});

describe("deleteStoredFiles", () => {
  test("deletes the company's files, the ones no row points at included", async () => {
    const { store, objects } = fakeStore(BUCKET);
    const outcome = await deleteStoredFiles(store, await companyFiles(), NO_WAIT);
    expect(outcome).toEqual({
      state: "complete",
      deleted: 6,
      pendingPrefixes: [],
      keys: [],
      refused: 0,
    });
    expect([...objects].sort()).toEqual([INVOICE, OTHER_TENANT].sort());
  });

  test("never deletes a key outside the company's folders, whichever row held it", async () => {
    const { store, objects } = fakeStore(BUCKET);
    const outcome = await deleteStoredFiles(
      store,
      { prefixes: companyUploadFolders(COMPANY), keys: [OTHER_TENANT, INVOICE] },
      NO_WAIT,
    );
    expect(objects.has(OTHER_TENANT)).toBe(true);
    expect(objects.has(INVOICE)).toBe(true);
    expect(outcome.pendingPrefixes).toEqual([]);
  });

  test("refuses a key that climbs out of its folder and leaves the folder pending", async () => {
    const { store, calls } = fakeStore([...BUCKET, CLIMBING]);
    const files = await companyFiles();
    const outcome = await deleteStoredFiles(
      store,
      { ...files, keys: [...files.keys, CLIMBING] },
      NO_WAIT,
    );
    expect(calls.remove.has(CLIMBING)).toBe(false);
    expect(outcome.refused).toBe(1);
    expect(outcome.state).toBe("pending");
    expect(outcome.pendingPrefixes).toEqual([CERTS]);
  });

  test("records a file it could not delete as pending, after a bounded retry", async () => {
    const { store, objects, calls } = fakeStore(BUCKET, { remove: CERTIFICATE });
    const outcome = await deleteStoredFiles(store, await companyFiles(), NO_WAIT);
    expect(outcome).toEqual({
      state: "pending",
      deleted: 5,
      pendingPrefixes: [CERTS],
      keys: [CERTIFICATE],
      refused: 0,
    });
    expect(calls.remove.get(CERTIFICATE)).toBe(3);
    expect(objects.has(CERTIFICATE)).toBe(true);
  });

  // Listing needs s3:ListBucket, which no other path uses. Without it the
  // files the rows name still go, and every folder is left pending.
  test("still deletes the rows' files when the folders cannot be listed", async () => {
    const { store, objects } = fakeStore(BUCKET, { list: true });
    const outcome = await deleteStoredFiles(store, await companyFiles(), NO_WAIT);
    expect(outcome.deleted).toBe(4);
    expect(outcome.pendingPrefixes).toEqual(companyUploadFolders(COMPANY));
    expect(objects.has(OLD_LOGO)).toBe(true);
    expect(objects.has(LOGO)).toBe(false);
  });
});

describe("retryFiles", () => {
  // A key that failed once must stay deletable where listing is refused.
  test("hands a retry the recorded keys, so it can delete them without listing", async () => {
    const first = fakeStore(BUCKET, { list: true, remove: CERTIFICATE });
    const outcome = await deleteStoredFiles(first.store, await companyFiles(), NO_WAIT);
    expect(outcome.keys).toEqual([CERTIFICATE]);

    const second = fakeStore([CERTIFICATE], { list: true });
    await deleteStoredFiles(second.store, retryFiles(COMPANY, outcome), NO_WAIT);
    expect(second.objects.has(CERTIFICATE)).toBe(false);
  });

  test("cannot be widened by a damaged outcome", () => {
    const damaged: FileOutcome = {
      state: "pending",
      deleted: 0,
      pendingPrefixes: ["", "billing/", `evidence/${OTHER}/`, CERTS],
      keys: [INVOICE, OTHER_TENANT, CLIMBING, CERTIFICATE],
      refused: 0,
    };
    expect(retryFiles(COMPANY, damaged)).toEqual({
      prefixes: [CERTS],
      keys: [CERTIFICATE],
    });
  });
});

describe("afterRetryWindow", () => {
  const erasedAt = new Date("2026-09-01T10:00:00.000Z");
  const pending: FileOutcome = {
    state: "pending",
    deleted: 2,
    pendingPrefixes: [CERTS],
    keys: [],
    refused: 0,
  };
  const daysLater = (days: number) =>
    new Date(erasedAt.getTime() + days * 24 * 60 * 60 * 1000);

  test("keeps retrying inside the window", () => {
    expect(
      afterRetryWindow(pending, erasedAt, daysLater(ERASURE_FILE_RETRY_DAYS - 1)).state,
    ).toBe("pending");
  });

  test("hands the deletion to an operator once the window has passed", () => {
    expect(
      afterRetryWindow(pending, erasedAt, daysLater(ERASURE_FILE_RETRY_DAYS)).state,
    ).toBe("manual");
  });

  test("never turns a finished deletion into a manual one", () => {
    const complete: FileOutcome = { ...pending, state: "complete", pendingPrefixes: [] };
    expect(afterRetryWindow(complete, erasedAt, daysLater(30)).state).toBe("complete");
  });
});

describe("settleStoredFiles", () => {
  const files = { prefixes: companyUploadFolders(COMPANY), keys: [CERTIFICATE] };

  test("records a failed deletion and does not throw", async () => {
    const { store } = fakeStore([CERTIFICATE], { remove: CERTIFICATE });
    const recorded: FileOutcome[] = [];
    const errors = spyOn(console, "error").mockImplementation(() => {});
    try {
      const outcome = await settleStoredFiles(
        store,
        files,
        async (o) => {
          recorded.push(o);
        },
        "erasure ERASURE-2026-0001",
        NO_WAIT,
      );
      expect(outcome.pendingPrefixes).toEqual([CERTS]);
      expect(recorded).toEqual([outcome]);
      // Keys carry the uploaded file's name, here an employee's.
      const logged = errors.mock.calls.flat().join(" ");
      expect(logged).toContain("ERASURE-2026-0001");
      expect(logged).not.toContain("Anna_Muster");
    } finally {
      errors.mockRestore();
    }
  });

  test("does not throw when even recording the outcome fails", async () => {
    const { store } = fakeStore([CERTIFICATE]);
    const errors = spyOn(console, "error").mockImplementation(() => {});
    try {
      const outcome = await settleStoredFiles(
        store,
        files,
        async () => {
          throw new Error("database gone");
        },
        "erasure ERASURE-2026-0002",
        NO_WAIT,
      );
      expect(outcome.state).toBe("complete");
      expect(errors.mock.calls.flat().join(" ")).toContain("not recorded");
    } finally {
      errors.mockRestore();
    }
  });
});

describe("storedFileState", () => {
  test("has nothing to say when no company was torn down", () => {
    expect(storedFileState(false, undefined)).toEqual({ kind: "not_applicable" });
  });

  // Every teardown made before files were deleted at all.
  test("never reads a missing outcome as complete", () => {
    expect(storedFileState(true, undefined)).toEqual({ kind: "unrecorded" });
    expect(storedFileState(true, { something: "else" })).toEqual({ kind: "unrecorded" });
  });

  test("reads the recorded outcome", () => {
    expect(
      storedFileState(true, { state: "complete", deleted: 6, pendingPrefixes: [] }),
    ).toEqual({ kind: "complete", deleted: 6 });
    expect(
      storedFileState(true, { state: "pending", deleted: 5, pendingPrefixes: ["x/"] }),
    ).toEqual({ kind: "pending", deleted: 5, pendingPrefixes: ["x/"] });
    expect(
      storedFileState(true, { state: "manual", deleted: 5, pendingPrefixes: ["x/"] }),
    ).toEqual({ kind: "manual", deleted: 5, pendingPrefixes: ["x/"] });
  });
});
