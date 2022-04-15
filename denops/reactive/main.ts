import { Denops } from "https://deno.land/x/denops_std@v3.3.0/mod.ts";
import { echo } from "https://deno.land/x/denops_std@v3.3.0/helper/mod.ts";
import { readLines } from "https://deno.land/std@0.134.0/io/mod.ts";

type Expr = {
  type: string;
  range: Range;
  identifiers: Identifier[];
};

type Identifier = {
  range: Range;
};

type Range = {
  start: {
    row: number,
    col: number,
  },
  end: {
    row: number,
    col: number,
  },
};

export async function main(denops: Denops): Promise<void> {

  let julia: Deno.Process<{
    cmd: [string],
    stdin: "piped",
    stdout: "piped",
  }>;

  const encoder = new TextEncoder();

  denops.dispatcher = {
    async attach() {
      julia = Deno.run({
        cmd: ["julia"],
        stdin: "piped",
        stdout: "piped",
      });
      for await (const line of readLines(julia.stdout)) {
        echo(denops, line);
      }
    },
    async version() {
      if (!julia) {
        return;
      }
      else {
        return await julia.stdin.write(encoder.encode("versioninfo()\n"));
      }
    },
    async tree() {
      const exprs = await denops.call(
        "luaeval",
        `require("${denops.name}").parse_buffer()`
      ) as Expr[];
      console.log(exprs);
    }
  };

  await denops.cmd(
    `command! Reactive call denops#notify("${denops.name}", "attach", [])`,
  );
  await denops.cmd(
    `command! Version call denops#notify("${denops.name}", "version", [])`,
  );
  await denops.cmd(
    `command! Tree call denops#notify("${denops.name}", "tree", [])`,
  );
}
