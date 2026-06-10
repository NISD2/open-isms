import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function TrainingPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  return <>{children}</>;
}
