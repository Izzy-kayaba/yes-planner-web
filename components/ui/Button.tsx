import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "light";
type ButtonSize = "default" | "large";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-vow-wine bg-vow-wine text-white shadow-[0_8px_24px_rgba(127,52,72,.18)] hover:border-vow-wine-deep hover:bg-vow-wine-deep",
  secondary: "border-vow-line bg-vow-surface text-vow-ink shadow-vow-soft hover:border-vow-wine",
  ghost: "border-transparent bg-transparent text-vow-ink hover:bg-vow-soft",
  light: "border-white bg-white text-vow-wine-deep hover:bg-vow-blush",
};

export function buttonStyles({
  variant = "primary",
  size = "default",
  fullWidth = false,
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}) {
  return cn(
    "inline-flex min-h-11 items-center justify-center gap-2.5 rounded-xl border px-5 text-[13px] font-bold transition hover:-translate-y-px focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-vow-wine/30 disabled:pointer-events-none disabled:opacity-45",
    variantClasses[variant],
    size === "large" && "min-h-13 px-6 text-sm",
    fullWidth && "w-full",
    className,
  );
}

export function Button({
  variant,
  size,
  fullWidth,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}) {
  return <button className={buttonStyles({ variant, size, fullWidth, className })} {...props} />;
}
