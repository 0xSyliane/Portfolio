/**
 * Structural fingerprint used by parity tests: same keys AND same list lengths
 * (TypeScript only checks keys). Primitive values collapse to their `typeof`.
 *
 *   assert.deepEqual(shape(cvEn), shape(cvFr));
 */
export function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)]));
  }
  return typeof value;
}
