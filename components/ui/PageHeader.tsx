type PageHeaderProps = {
  eyebrow: string;
  title: string;
  badge?: string;
};

const EYEBROW: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains-mono)",
  fontSize: "10px",
  letterSpacing: "0.24em",
  color: "var(--color-wc-ink)",
  opacity: 0.55
};

const TITLE: React.CSSProperties = {
  fontFamily: "var(--font-archivo-black)",
  fontSize: "clamp(36px, 5vw, 56px)",
  lineHeight: 1,
  letterSpacing: "-0.03em",
  color: "var(--color-wc-ink)"
};

export const BADGE_STYLE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  fontFamily: "var(--font-jetbrains-mono)",
  fontSize: "10px",
  letterSpacing: "0.22em",
  padding: "5px 10px",
  border: "1px solid var(--color-wc-ink)",
  background: "var(--color-wc-cream)",
  color: "var(--color-wc-ink)"
};

export function PageHeader({ eyebrow, title, badge }: PageHeaderProps) {
  return (
    <header
      className="px-4 py-7 sm:px-6 sm:py-8"
      style={{ background: "var(--color-wc-cream)", borderBottom: "3px solid var(--color-wc-ink)" }}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div style={EYEBROW}>{eyebrow}</div>
          <h1 className="mt-2" style={TITLE}>
            {title}
          </h1>
        </div>
        {badge && (
          <span className="self-start md:self-auto" style={BADGE_STYLE}>
            {badge}
          </span>
        )}
      </div>
    </header>
  );
}
