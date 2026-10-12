import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const toDate = (iso: string): string => iso.slice(0, 10);

/** Runs git in `cwd`; undefined when git is missing, `cwd` is not a repository or the command fails. */
export type GitRunner = (args: readonly string[], cwd: string) => string | undefined;

const runGit: GitRunner = (args, cwd) => {
  try {
    return execFileSync("git", [...args], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return undefined;
  }
};

/** Every file under the given paths (directories are walked: a directory's own mtime never changes on edit). */
const filesUnder = (paths: readonly string[], cwd: string): string[] =>
  paths
    .map((p) => join(cwd, p))
    .filter((p) => existsSync(p))
    .flatMap((p) =>
      statSync(p).isDirectory()
        ? readdirSync(p, { recursive: true, withFileTypes: true })
            .filter((entry) => entry.isFile())
            .map((entry) => join(entry.parentPath, entry.name))
        : [p],
    );

const newestMtime = (paths: readonly string[], cwd: string): string | undefined => {
  const times = filesUnder(paths, cwd).map((file) => statSync(file).mtimeMs);
  return times.length > 0 ? toDate(new Date(Math.max(...times)).toISOString()) : undefined;
};

/**
 * Real `lastmod` (YYYY-MM-DD) of a page: the date of the last git commit touching its source
 * files. File mtimes are NOT trusted on their own (a fresh CI checkout stamps every file with
 * the deploy date); they are only used while `git status` reports local edits in those paths,
 * where an uncommitted edit is newer than the last commit. Returns undefined when git cannot
 * date the page: the sitemap then omits `<lastmod>` rather than lying. Build-time only.
 */
export const lastmodFor = (
  paths: readonly string[],
  cwd: string = process.cwd(),
  git: GitRunner = runGit,
): string | undefined => {
  const committedIso = git(["log", "-1", "--format=%cI", "--", ...paths], cwd);
  const committed = committedIso ? toDate(committedIso) : undefined;
  const dirty = (git(["status", "--porcelain", "--", ...paths], cwd) ?? "") !== "";
  if (!dirty) return committed;
  const edited = newestMtime(paths, cwd);
  if (committed && edited) return edited > committed ? edited : committed;
  return edited ?? committed;
};
