import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

/**
 * Lists regular files under `dir` with `find` (never `git ls-files`: build
 * output and untracked work must be checked too). Returns absolute paths.
 */
export const listFiles = (dir) => {
  if (!existsSync(dir)) return [];
  const out = execFileSync("find", [dir, "-type", "f", "-print0"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return out.split("\0").filter(Boolean).sort();
};
