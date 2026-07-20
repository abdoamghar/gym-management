"use client";

export function EmptyState({
  title,
  hint,
  icon = "○",
}: {
  title: string;
  hint?: string;
  icon?: string;
}) {
  return (
    <div className="card empty-state">
      <div className="empty-icon" aria-hidden>
        {icon}
      </div>
      <p className="empty-title">{title}</p>
      {hint ? <p className="empty-hint">{hint}</p> : null}
    </div>
  );
}
