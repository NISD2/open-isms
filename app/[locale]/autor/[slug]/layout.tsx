import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";

export default function AuthorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNav />
      <main className="mx-auto max-w-4xl px-6 pt-24 pb-16 sm:pt-28 lg:px-0">
        {children}
      </main>
      <PublicFooter />
    </>
  );
}
