import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "light";
type ButtonSize = "default" | "large";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-yes-wine bg-yes-wine text-white shadow-[0_8px_24px_rgba(127,52,72,.18)] hover:border-yes-wine-deep hover:bg-yes-wine-deep",
  secondary: "border-yes-line bg-yes-surface text-yes-ink shadow-yes-soft hover:border-yes-wine",
  ghost: "border-transparent bg-transparent text-yes-ink hover:bg-yes-soft",
  light: "border-white bg-white text-yes-wine-deep hover:bg-yes-blush",
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
    "inline-flex min-h-11 items-center justify-center gap-2.5 rounded-xl border px-5 text-[14px] font-bold transition hover:-translate-y-px focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-yes-wine/30 disabled:pointer-events-none disabled:opacity-45",
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
