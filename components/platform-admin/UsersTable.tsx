"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { planBadge, timeAgo } from "./admin-format";
import { EraseUserButton } from "./GdprErasure";
import { UserName } from "./UserDialog";

export interface UserRow {
  id: string;
  email: string;
  name: string;
  /** Role in the company the person has open; null without one. */
  role: string | null;
  createdAt: Date;
  companyId: string | null;
  companyName: string | null;
  companySector: string | null;
  companyPlan: string | null;
}

/** Whether a row matches the search: any word of it in the name, email or company. */
const matches = (u: UserRow, query: string) => {
  const haystack = `${u.name} ${u.email} ${u.companyName ?? ""}`.toLowerCase();
  return query
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .every((word) => haystack.includes(word));
};

/** Every user, searchable by name, email or company; a name opens everything about the person. */
export function UsersTable({ users }: { users: UserRow[] }) {
  const [query, setQuery] = useState("");
  const shown = query.trim() ? users.filter((u) => matches(u, query)) : users;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-base">
          All Users
          {query.trim() && (
            <span className="ml-2 font-normal text-muted-foreground">
              ({shown.length} of {users.length})
            </span>
          )}
        </CardTitle>
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email or company"
            aria-label="Search users"
            className="h-9 pl-8"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Email</th>
                <th className="pb-2 pr-4 font-medium">Company</th>
                <th className="pb-2 pr-4 font-medium">Plan</th>
                <th className="pb-2 pr-4 font-medium">Role</th>
                <th className="pb-2 pr-4 font-medium">Joined</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((u) => (
                <tr key={u.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2 pr-4 font-medium">
                    <UserName id={u.id}>{u.name}</UserName>
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">{u.email}</td>
                  <td className="py-2 pr-4">
                    {u.companyName ?? (
                      <span className="text-muted-foreground italic">none</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">{planBadge(u.companyPlan)}</td>
                  <td className="py-2 pr-4">{u.role}</td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {timeAgo(u.createdAt)}
                  </td>
                  <td className="py-2">
                    <EraseUserButton userId={u.id} email={u.email} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {shown.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nobody matches “{query}”.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
