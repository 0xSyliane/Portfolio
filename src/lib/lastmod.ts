import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

const toDate = (iso: string): string => iso.slice(0, 10);

const gitLastCommit = (paths: readonly string[], cwd: string): string | undefined => {
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cI", "--", ...paths], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return out ? toDate(out) : undefined;
  } catch {
    return undefined;
  }
};

const newestMtime = (paths: readonly string[], cwd: string): string | undefined => {
  const times = paths
    .map((p) => join(cwd, p))
    .filter((p) => existsSync(p))
    .map((p) => statSync(p).mtimeMs);
  return times.length > 0 ? toDate(new Date(Math.max(...times)).toISOString()) : undefined;
};

/**
 * Real `lastmod` (YYYY-MM-DD) for a page: date of the last git commit touching
 * its source files; falls back to the newest file mtime (uncommitted work, or a
 * checkout without history), then to today. Build-time only.
 */
export const lastmodFor = (paths: readonly string[], cwd: string = process.cwd()): string => {
  const committed = gitLastCommit(paths, cwd);
  const edited = newestMtime(paths, cwd);
  // An uncommitted edit is newer than the last commit.
  if (committed && edited) return edited > committed ? edited : committed;
  return committed ?? edited ?? toDate(new Date().toISOString());
};
