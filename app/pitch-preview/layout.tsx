export default function PitchPreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body style={{ margin: 0, padding: 0, overflow: "hidden", background: "white" }}>
        {children}
      </body>
    </html>
  );
}
