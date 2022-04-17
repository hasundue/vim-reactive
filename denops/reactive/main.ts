import type { Denops } from "./deps.ts";
import { vim, autocmd, bufname, option, buffer, batch } from "./deps.ts";
import { Session } from "./types.ts";
import { parse } from "./funcs.ts";

export function main(denops: Denops) {
  // const encoder = new TextEncoder();
  const sessions: { [bufnr: number]: Session } = {};

  denops.dispatcher = {
    async attach() {
      const bufnr = await vim.bufnr(denops);

      sessions[bufnr] = {
        server: Deno.run({
          cmd: ["julia"],
          stdin: "piped",
          stdout: "piped",
        }),
        bufnr,
      };
      console.log("julia server attached to the buffer.");

      await autocmd.group(denops, "reactive-debug", (helper) => {
        helper.remove();
        helper.define(
          ["InsertLeave", "TextChanged"],
          `<buffer=${bufnr}>`,
          `call denops#notify("${denops.name}", "debug", [])`,
        );
      });
    },

    async debug() {
      const bufnr = await vim.bufnr(denops);
      const session = sessions[bufnr];

      if (!session.debugBufnr) return;

      const winid = await vim.bufwinid(denops, session.debugBufnr);
      if (winid < 0) return;

      const exprs = await parse(denops, session);

      await denops.cmd(`silent call deletebufline(${session.debugBufnr}, 1, "$")`);
      await vim.setbufline(denops, session.debugBufnr, 1, JSON.stringify(exprs, null, 2).split("\n"));
    },

    async openDebugBuffer() {
      const bufnr = await vim.bufnr(denops);
      const session = sessions[bufnr];

      if (!session) {
        console.error("No server is attached to the buffer.");
        return;
      }

      const filename = await vim.expand(denops, "%:t")
      const name = bufname.format({
        scheme: "reactive",
        expr: "debug/" + filename,
      })
      await batch(denops, async (denops) => {
        await denops.cmd("vsplit");
        await buffer.open(denops, name);
      });
      session.debugBufnr = await vim.bufnr(denops);

      await option.buftype.setLocal(denops, "nofile");
      await option.swapfile.setLocal(denops, false);
      await option.buflisted.setLocal(denops, false);
      await option.filetype.setLocal(denops, "vim-reactive");

      const winnr = await vim.bufwinnr(denops, session.bufnr);
      await denops.cmd(`exe ${winnr} .. "wincmd w"`);
      denops.cmd(`call denops#notify("${denops.name}", "debug", [])`);
    },
  };
}
