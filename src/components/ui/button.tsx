import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type Variant = "primary" | "accent" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-charcoal disabled:bg-hairline disabled:text-muted rounded-full",
  accent: "bg-brand-green text-primary hover:bg-brand-green-deep rounded-full",
  secondary: "bg-transparent text-ink border border-hairline hover:bg-surface rounded-full",
  ghost: "bg-transparent text-ink hover:bg-surface rounded-md",
  danger: "bg-transparent text-brand-error border border-hairline hover:bg-surface rounded-full",
};

const sizeClasses: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  sm: "px-3 py-1.5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center gap-2 font-medium leading-tight transition-colors duration-150 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
