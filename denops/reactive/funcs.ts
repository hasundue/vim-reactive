import type { Denops } from "./deps.ts";
import type { Expr, Session } from "./types.ts";

export async function parse(denops: Denops, session: Session) {
  const exprs = await denops.call(
    "luaeval",
    `require("${denops.name}").parse_buffer(${session.bufnr}, "julia")`
  ) as Expr[];
  return exprs;
}

// for await (const line of readLines(session.server.stdout)) {
//   helper.echo(denops, line);
// }

// async version() {
//   if (!session) {
//     return;
//   }
//   else {
//     return await session.server.stdin.write(encoder.encode("versioninfo()\n"));
//   }
// },
