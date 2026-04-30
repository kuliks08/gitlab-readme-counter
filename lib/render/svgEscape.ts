/**
 * Экранирование для текстовых узлов в SVG/XML.
 * Удаляет недопустимые управляющие символы (кроме \t \n \r).
 */
export function escapeSvgText(s: string): string {
  const cleaned = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  return cleaned
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
