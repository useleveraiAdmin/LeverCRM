export function MemberHeader({ gymName }: { gymName: string }) {
  return (
    <header className="app-header">
      <p className="font-display text-xl" style={{ color: "var(--foreground)" }}>
        {gymName}
      </p>
    </header>
  );
}
