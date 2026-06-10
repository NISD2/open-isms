"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Bug,
  ChevronDown,
  ChevronUp,
  DatabaseZap,
  Globe,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

const ROLES = ["admin", "member", "reviewer", "legal_reviewer"] as const;

export function AdminTestPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // dev.deleteCompany ships only in dev builds; `?.` for optional chaining
  // mirrors the switchRole pattern below. In prod builds the panel itself
  // doesn't render (NODE_ENV check at line 45), so the undefined case is
  // unreachable at runtime.
  const deleteMutation = trpc.dev?.deleteCompany.useMutation({
    onSuccess: () => {
      toast.success("Organization deleted");
      router.push("/organization");
    },
    onError: (err) => {
      toast.error(`Failed to delete: ${err.message}`);
    },
  });

  const roleMutation = trpc.dev?.switchRole.useMutation({
    onSuccess: (data) => {
      toast.success(`Role → ${data.role}`);
      router.refresh();
    },
    onError: (err) => {
      toast.error(`Role switch failed: ${err.message}`);
    },
  });

  if (process.env.NODE_ENV !== "development") return null;

  function toggleLocale() {
    const current = document.cookie
      .split("; ")
      .find((c) => c.startsWith("locale="))
      ?.split("=")[1] ?? "en";
    const next = current === "en" ? "de" : "en";
    document.cookie = `locale=${next};path=/;max-age=${60 * 60 * 24 * 365}`;
    toast.success(`Locale → ${next.toUpperCase()}`);
    router.refresh();
  }

  async function reseed() {
    setSeeding(true);
    const toastId = toast.loading("Re-seeding database...");
    try {
      const res = await fetch("/api/dev/seed", { method: "POST" });
      const data = await res.json();
      toast.dismiss(toastId);
      if (data.ok) {
        toast.success("Database re-seeded");
        router.refresh();
      } else {
        toast.error(`Seed failed: ${data.error}`);
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(`Seed failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="fixed top-2 right-2 z-50">
      <div className="rounded-lg border border-destructive/30 bg-background shadow-lg">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/5 rounded-lg"
        >
          <Bug className="size-3.5" />
          Dev
          {open ? (
            <ChevronUp className="size-3" />
          ) : (
            <ChevronDown className="size-3" />
          )}
        </button>
        {open && (
          <div className="border-t border-destructive/20 p-2 space-y-1.5 min-w-[160px]">
            {/* Role switcher */}
            <div className="flex gap-1">
              {ROLES.map((role) => (
                <Button
                  key={role}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-[10px] h-6 px-1"
                  disabled={roleMutation?.isPending}
                  onClick={() => roleMutation?.mutate({ role })}
                >
                  <ShieldCheck className="mr-0.5 size-2.5" />
                  {role}
                </Button>
              ))}
            </div>

            {/* Locale toggle */}
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs h-7"
              onClick={toggleLocale}
            >
              <Globe className="mr-1.5 size-3" />
              Toggle EN/DE
            </Button>

            {/* Re-seed */}
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs h-7"
              disabled={seeding}
              onClick={reseed}
            >
              <DatabaseZap className="mr-1.5 size-3" />
              {seeding ? "Seeding..." : "Re-seed DB"}
            </Button>

            {/* Delete org */}
            <Button
              variant="destructive"
              size="sm"
              className="w-full text-xs h-7"
              disabled={deleteMutation?.isPending}
              onClick={() => deleteMutation?.mutate()}
            >
              <Trash2 className="mr-1.5 size-3" />
              {deleteMutation?.isPending ? "Deleting..." : "Delete Org"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
