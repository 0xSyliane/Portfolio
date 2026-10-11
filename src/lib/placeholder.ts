/**
 * `[[…]]` marks a fact that is not known yet. It must never reach production:
 * `check:publish` fails on it and JSON-LD skips any field containing it.
 */
/** True if the string contains a `[[…]]` marker. */
export const isPlaceholder = (value: unknown): boolean =>
  typeof value === "string" && value.includes("[[");

/** True if any string anywhere inside `value` (deep) is a placeholder. */
export const hasPlaceholder = (value: unknown): boolean => {
  if (typeof value === "string") return isPlaceholder(value);
  if (Array.isArray(value)) return value.some(hasPlaceholder);
  if (value && typeof value === "object") return Object.values(value).some(hasPlaceholder);
  return false;
};

/** Every placeholder's JSON path inside `value`, for readable reports. */
export const findPlaceholders = (value: unknown, path = "$"): string[] => {
  if (typeof value === "string") return isPlaceholder(value) ? [`${path}  ${value}`] : [];
  if (Array.isArray(value)) return value.flatMap((v, i) => findPlaceholders(v, `${path}[${i}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => findPlaceholders(v, `${path}.${k}`));
  }
  return [];
};
