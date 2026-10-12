// @ts-check
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Lists regular files under `dir` (never `git ls-files`: build output and untracked work must be
 * checked too). Symlinks are skipped. Returns sorted absolute paths; a missing directory is empty.
 * @param {string} dir
 * @returns {string[]}
 */
export const listFiles = (dir) => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
    .sort();
};
