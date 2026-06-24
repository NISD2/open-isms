/**
 * Root <html>/<body> for the non-localized /email/* routes (e.g. the
 * unsubscribe confirmation page). The app's root layout (app/layout.tsx)
 * returns bare children and delegates the document shell to
 * app/[locale]/layout.tsx, so routes outside the [locale] segment need to
 * provide their own html/body. Without this, Next 16 raises
 * "Missing <html> and <body> tags in the root layout".
 */
export default function EmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">{children}</body>
    </html>
  );
}
