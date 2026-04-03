import React from "react";
import clsx from "clsx";

type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  className,
  disabled,
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        
        // SIZE
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-5 py-2 text-sm",
        size === "lg" && "px-6 py-3 text-base",

        // VARIANTS
        variant === "primary" &&
          "bg-black text-white hover:bg-gray-900 active:scale-95",
        
        variant === "secondary" &&
          "bg-gray-100 text-black hover:bg-gray-200 active:scale-95",
        
        variant === "ghost" &&
          "bg-transparent text-black hover:bg-gray-100",
        
        variant === "danger" &&
          "bg-red-600 text-white hover:bg-red-700 active:scale-95",

        disabled && "opacity-50 cursor-not-allowed",

        className
      )}
    >
      {children}
    </button>
  );
}
