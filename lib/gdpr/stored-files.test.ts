/**
 * Tearing a company down used to delete its rows and leave every file they
 * pointed at in the bucket, training certificates with employees' names
 * included, while the certificate said everything was gone. These cases pin
 * which files a teardown deletes, which it must never touch, and that a
 * failure after the commit is recorded rather than thrown.
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
  collectCompanyFiles,
  deleteStoredFiles,
  type FileDeletion,
  type FileStore,
  type Retry,
  settleStoredFiles,
  storedFileState,
} from "./stored-files";

const COMPANY = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

const EVIDENCE = `evidence/${COMPANY}/status-1/a1-Pentest_Bericht.pdf`;
const CERTIFICATE = `companies/${COMPANY}/training-certs/b2-Zertifikat_Anna_Muster.pdf`;
const CERTIFICATION = `supplier-certifications/${COMPANY}/1759219200000-iso27001.pdf`;
const LOGO = `supplier-profile/${COMPANY}/logo-1759219200000-logo.png`;
/** Replaced long ago: no row points at it, but it is still the company's file. */
const OLD_LOGO = `supplier-profile/${COMPANY}/logo-1700000000000-old.png`;
/** Uploaded and never attached to a certification. */
const ABANDONED = `supplier-certifications/${COMPANY}/1759000000000-draft.pdf`;

const OTHER_TENANT = `evidence/${OTHER}/status-9/c3-theirs.pdf`;
const INVOICE = "billing/account-1/RE-2026-0001.pdf";

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

describe("collectCompanyFiles", () => {
  test("reads every key the company's rows hold, and its upload folders", async () => {
    const files = await collectCompanyFiles(fakeTx(companyRows()), COMPANY);
    expect([...new Set(files.keys)].sort()).toEqual(
      [EVIDENCE, CERTIFICATE, CERTIFICATION, LOGO].sort(),
    );
    expect(files.prefixes).toEqual(companyUploadFolders(COMPANY));
  });
});

describe("deleteStoredFiles", () => {
  const bucket = [
    EVIDENCE,
    CERTIFICATE,
    CERTIFICATION,
    LOGO,
    OLD_LOGO,
    ABANDONED,
    OTHER_TENANT,
    INVOICE,
  ];

  test("deletes the company's files, the ones no row points at included", async () => {
    const { store, objects } = fakeStore(bucket);
    const files = await collectCompanyFiles(fakeTx(companyRows()), COMPANY);
    const outcome = await deleteStoredFiles(store, files, NO_WAIT);
    expect(outcome).toEqual({ deleted: 6, pendingPrefixes: [] });
    expect([...objects].sort()).toEqual([INVOICE, OTHER_TENANT].sort());
  });

  // A row written before keys were checked on write may name any object.
  test("never deletes a key outside the company's folders, whichever row held it", async () => {
    const { store, objects } = fakeStore(bucket);
    const outcome = await deleteStoredFiles(
      store,
      { prefixes: companyUploadFolders(COMPANY), keys: [OTHER_TENANT, INVOICE] },
      NO_WAIT,
    );
    expect(objects.has(OTHER_TENANT)).toBe(true);
    expect(objects.has(INVOICE)).toBe(true);
    expect(outcome.pendingPrefixes).toEqual([]);
  });

  test("records a file it could not delete as pending, after a bounded retry", async () => {
    const { store, objects, calls } = fakeStore(bucket, { remove: CERTIFICATE });
    const files = await collectCompanyFiles(fakeTx(companyRows()), COMPANY);
    const outcome = await deleteStoredFiles(store, files, NO_WAIT);
    expect(outcome).toEqual({
      deleted: 5,
      pendingPrefixes: [`companies/${COMPANY}/training-certs/`],
    });
    expect(calls.remove.get(CERTIFICATE)).toBe(3);
    expect(objects.has(CERTIFICATE)).toBe(true);
  });

  // Listing needs s3:ListBucket, which no other path uses. Without it the
  // files the rows name still go, and every folder is left pending.
  test("still deletes the rows' files when the folders cannot be listed", async () => {
    const { store, objects } = fakeStore(bucket, { list: true });
    const files = await collectCompanyFiles(fakeTx(companyRows()), COMPANY);
    const outcome = await deleteStoredFiles(store, files, NO_WAIT);
    expect(outcome.deleted).toBe(4);
    expect(outcome.pendingPrefixes).toEqual(companyUploadFolders(COMPANY));
    expect(objects.has(OLD_LOGO)).toBe(true);
    expect(objects.has(LOGO)).toBe(false);
  });
});

describe("settleStoredFiles", () => {
  const files = { prefixes: companyUploadFolders(COMPANY), keys: [CERTIFICATE] };

  test("records a failed deletion and does not throw", async () => {
    const { store } = fakeStore([CERTIFICATE], { remove: CERTIFICATE });
    const recorded: FileDeletion[] = [];
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
      expect(outcome.pendingPrefixes).toEqual([`companies/${COMPANY}/training-certs/`]);
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
      expect(outcome).toEqual({ deleted: 1, pendingPrefixes: [] });
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
    expect(storedFileState(true, { deleted: 6, pendingPrefixes: [] })).toEqual({
      kind: "complete",
      deleted: 6,
    });
    expect(storedFileState(true, { deleted: 5, pendingPrefixes: ["x/"] })).toEqual({
      kind: "pending",
      deleted: 5,
      pendingPrefixes: ["x/"],
    });
  });
});
