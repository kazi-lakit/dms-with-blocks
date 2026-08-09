import { InputHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx(
        "h-10 w-full rounded-md border border-hairline bg-canvas px-3.5 text-sm text-ink placeholder:text-muted",
        "outline-none focus:border-2 focus:border-brand-green focus:px-[13px]",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
