import type { Denops } from "./deps.ts";
import type { Session, Expr } from "./types.ts";
import { vim } from "./deps.ts";

export async function debug(denops: Denops, session: Session, exprs: Expr[]) {
  if (!session.debugBufnr) return;

  const winid = await vim.bufwinid(denops, session.debugBufnr);
  if (winid < 0) return;

  await denops.cmd(`silent call deletebufline(${session.debugBufnr}, 1, "$")`);
  await vim.setbufline(denops, session.debugBufnr, 1, JSON.stringify(exprs, null, 2).split("\n"));
}

