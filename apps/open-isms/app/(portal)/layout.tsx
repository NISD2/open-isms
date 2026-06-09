import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export const dynamic = "force-dynamic";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/compliance", label: "Compliance" },
];

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-60 shrink-0 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <Link href="/dashboard" className="text-xl font-semibold">
            open-isms
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">
            {session.user.email}
          </div>
          <form action={handleSignOut}>
            <button
              type="submit"
              className="w-full text-left rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
