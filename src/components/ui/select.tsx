import { SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

/**
 * A native <select>, but styled to match Input exactly (same height/padding/focus
 * treatment) instead of the browser default — `appearance-none` + a manual chevron so
 * it renders identically (and without a stray native focus ring) across browsers.
 */
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={clsx(
          "h-10 w-full appearance-none rounded-md border border-hairline bg-canvas pl-3.5 pr-9 text-sm text-ink",
          "outline-none focus:border-2 focus:border-brand-green focus:pl-[13px] focus:pr-[35px]",
          "disabled:opacity-50",
          className
        )}
        {...props}
      />
      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
    </div>
  )
);
Select.displayName = "Select";
