import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import type { UrlObject } from "url";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string | UrlObject;
  variant?: ButtonVariant;
};

const VARIANT_STYLE: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "var(--color-wc-ink)",
    color: "#fff",
    border: "none",
    boxShadow: "6px 6px 0 0 var(--color-wc-can-red)",
  },
  secondary: {
    background: "#fff",
    color: "var(--color-wc-ink)",
    border: "2px solid var(--color-wc-ink)",
  },
  danger: {
    background: "#fff",
    color: "var(--color-wc-can-red)",
    border: "2px solid var(--color-wc-ink)",
    boxShadow: "4px 4px 0 0 var(--color-wc-can-red)",
  },
  ghost: {
    background: "transparent",
    color: "var(--color-wc-ink)",
    border: "2px solid var(--color-wc-ink)",
  },
};

const baseStyle: React.CSSProperties = {
  fontFamily: "var(--font-archivo-black)",
  fontSize: "14px",
  letterSpacing: "0.04em",
  padding: "12px 22px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  textTransform: "uppercase",
  transition: "transform 120ms ease-out, opacity 120ms ease-out",
  whiteSpace: "nowrap",
};

const buttonBase =
  "hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-45";

export function Button({
  className = "",
  variant = "secondary",
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonBase, className)}
      style={{ ...baseStyle, ...VARIANT_STYLE[variant], ...style }}
      {...props}
    />
  );
}

export function LinkButton({
  className = "",
  variant = "secondary",
  href,
  style,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(buttonBase, className)}
      style={{ ...baseStyle, ...VARIANT_STYLE[variant], ...style }}
      {...props}
    />
  );
}
