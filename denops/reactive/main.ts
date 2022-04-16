import type { Denops } from "./deps.ts";
import { readLines, vim, helper, bufname, autocmd, option } from "./deps.ts";
import { Server, Expr } from "./types.ts";

export async function main(denops: Denops) {
  let server: Server;
  let bufnr: number;
  let debugBufnum: number;
  const encoder = new TextEncoder();

  async function parse() {
    const exprs = await denops.call(
      "luaeval",
      `require("${denops.name}").parse_buffer(${bufnr}, "julia")`
    ) as Expr[];
    return exprs;
  }

  async function debug() {
    const exprs = await parse();
    vim.appendbufline(denops, debugBufnum, 0, JSON.stringify(exprs, null, 2).split("\n"));
  }

  denops.dispatcher = {
    async attach() {
      server = Deno.run({
        cmd: ["julia"],
        stdin: "piped",
        stdout: "piped",
      });
      console.log("julia server attached to the buffer.");
      bufnr = await vim.bufnr(denops);

      for await (const line of readLines(server.stdout)) {
        helper.echo(denops, line);
      }
    },

    async initDebugBuffer() {
      await option.buftype.setLocal(denops, "nofile");
      await option.swapfile.setLocal(denops, false);
      await option.buflisted.setLocal(denops, false);
      await option.filetype.setLocal(denops, "vim-reactive");
      debug();
    },

    async openDebugBuffer() {
      if (!server) {
        console.error("No server is attached to the buffer.");
        return;
      }

      const filename = await vim.expand(denops, "%:t")
      const name = bufname.format({
        scheme: "reactive",
        expr: "debug/" + filename,
      })
      debugBufnum = await vim.bufadd(denops, name);
      await denops.cmd("vsplit `=name`", { name });

      const winnr = await vim.bufwinnr(denops, bufnr);
      await denops.cmd(`exe ${winnr} .. "wincmd w"`);
    },

    async version() {
      if (!server) {
        return;
      }
      else {
        return await server.stdin.write(encoder.encode("versioninfo()\n"));
      }
    },
  };

  await autocmd.group(denops, "reactive-debug", (helper) => {
    helper.remove();
    helper.define(
      "BufReadCmd",
      "reactive://debug/*",
      `call denops#notify("${denops.name}", "initDebugBuffer", [])`,
    );
  });
}
