import type { Denops } from "./deps.ts";
import { vim } from "./deps.ts";
import type { Session, FlattenSyntaxTree, Expr } from "./types.ts";

export async function parse(denops: Denops, session: Session) {
  const bufnr = session.bufnr;

  const trees = await denops.call(
    "luaeval",
    `require("${denops.name}").parse_buffer(${bufnr}, "julia")`
  ) as FlattenSyntaxTree[];

  const exprs = await Promise.all(trees.map(async tree => {
    const { start, end } = tree.range;

    const lines = await vim.getbufline(denops, bufnr, start.row, end.row);
    const l = lines.length;

    lines[0] = lines[0].slice(start.col-1);
    lines[l-1] = lines[l-1].slice(0, end.col-1);

    const expr: Expr = {
      str: lines.join("\n"),
      line: end.row - 1,
    };

    return expr;
  }));

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
