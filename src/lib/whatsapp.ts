/** Normalize Moroccan phone to international digits for wa.me (no +). */
export function normalizeMoroccoPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("212")) return digits;
  if (digits.startsWith("0") && digits.length >= 9) return `212${digits.slice(1)}`;
  if (digits.length === 9) return `212${digits}`;
  return digits;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const num = normalizeMoroccoPhone(phone);
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

export type TemplateVars = Record<string, string | number | undefined | null>;

export function renderTemplate(body: string, vars: TemplateVars): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = vars[key];
    return val == null ? "" : String(val);
  });
}
