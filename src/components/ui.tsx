"use client";

import { useTranslations } from "next-intl";

export function Spinner() {
  return <span className="spinner" aria-hidden />;
}

export function SubmitButton({
  loading,
  children,
  variant = "primary",
  className = "",
  ...rest
}: {
  loading: boolean;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const tCommon = useTranslations("common");
  const variantClass = variant === "primary" ? "btn btn-primary" : "btn btn-secondary";
  return (
    <button
      type="submit"
      className={`${variantClass} ${className}`}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <Spinner />
          <span className="sr-only">{tCommon("loading")}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
