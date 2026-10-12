import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { lastmodFor, type GitRunner } from "../../src/lib/lastmod.ts";

const git = (cwd: string, args: string[], date?: string): void => {
  execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.invalid", "-c", "commit.gpgsign=false", ...args], {
    cwd,
    stdio: "ignore",
    env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
  });
};

/** A throwaway repository (its own config, never the project's) with one commit dated 2024-03-05. */
const repo = (): string => {
  const cwd = mkdtempSync(join(tmpdir(), "portfolio-lastmod-"));
  mkdirSync(join(cwd, "src/page"), { recursive: true });
  writeFileSync(join(cwd, "src/page/a.txt"), "a");
  git(cwd, ["init", "-q"]);
  git(cwd, ["add", "."]);
  git(cwd, ["commit", "-q", "-m", "init"], "2024-03-05T10:00:00+00:00");
  return cwd;
};

test("a clean tree is dated by its last commit, whatever the file mtimes say", () => {
  const cwd = repo();
  try {
    // A fresh CI checkout stamps every file with "now": the date must not follow it.
    utimesSync(join(cwd, "src/page/a.txt"), new Date("2030-01-01"), new Date("2030-01-01"));
    assert.equal(lastmodFor(["src/page"], cwd), "2024-03-05");
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("local edits make the newest file mtime count, directories included", () => {
  const cwd = repo();
  try {
    const file = join(cwd, "src/page/a.txt");
    writeFileSync(file, "edited");
    utimesSync(file, new Date("2025-06-07T12:00:00Z"), new Date("2025-06-07T12:00:00Z"));
    assert.equal(lastmodFor(["src/page"], cwd), "2025-06-07");
    mkdirSync(dirname(join(cwd, "src/page/sub/b.txt")), { recursive: true });
    writeFileSync(join(cwd, "src/page/sub/b.txt"), "new");
    utimesSync(join(cwd, "src/page/sub/b.txt"), new Date("2025-08-09T12:00:00Z"), new Date("2025-08-09T12:00:00Z"));
    assert.equal(lastmodFor(["src/page"], cwd), "2025-08-09", "a nested untracked file is found");
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("unrelated local edits do not date the page", () => {
  const cwd = repo();
  try {
    writeFileSync(join(cwd, "other.txt"), "x");
    assert.equal(lastmodFor(["src/page"], cwd), "2024-03-05");
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("without git there is no date (the sitemap omits lastmod) and mtime is not trusted", () => {
  const none: GitRunner = () => undefined;
  assert.equal(lastmodFor(["src/page"], tmpdir(), none), undefined);
});
