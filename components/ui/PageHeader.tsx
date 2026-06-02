type PageHeaderProps = {
  eyebrow: string;
  title: string;
  badge?: string;
};

const EYEBROW: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains-mono)",
  fontSize: "10px",
  letterSpacing: "0.24em",
  color: "#0d0d10",
  opacity: 0.55
};

const TITLE: React.CSSProperties = {
  fontFamily: "var(--font-archivo-black)",
  fontSize: "clamp(36px, 5vw, 56px)",
  lineHeight: 1,
  letterSpacing: "-0.03em",
  color: "#0d0d10"
};

export const BADGE_STYLE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  fontFamily: "var(--font-jetbrains-mono)",
  fontSize: "10px",
  letterSpacing: "0.22em",
  padding: "5px 10px",
  border: "1px solid #0d0d10",
  background: "#fefaf0",
  color: "#0d0d10"
};

export function PageHeader({ eyebrow, title, badge }: PageHeaderProps) {
  return (
    <header
      className="px-4 py-7 sm:px-6 sm:py-8"
      style={{ background: "#fefaf0", borderBottom: "3px solid #0d0d10" }}
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
