import { cn } from "../../lib/utils";

const variants = {
  primary: "bg-gradient-to-r from-blue-500 to-red-500 text-white hover:shadow-lg",
  outline: "border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50",
  ghost: "text-gray-600 hover:bg-gray-100",
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-2.5 text-sm",
  lg: "px-8 py-3 text-base",
};

export function Button({ variant = "primary", size = "md", className, children, ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-smooth disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
