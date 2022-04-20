import type { Denops } from "./deps.ts";
import { vim, nvim, autocmd, bufname, option, buffer, batch } from "./deps.ts";
import { readLines } from "./deps.ts";
import { Session } from "./types.ts";
import { parse } from "./funcs.ts";
import { debug } from "./debug.ts";

export function main(denops: Denops) {
  const sessions: { [bufnr: number]: Session } = {};
  const encoder = new TextEncoder();

  denops.dispatcher = {
    async attach() {
      const bufnr = await vim.bufnr(denops);

      if (sessions[bufnr]) {
        console.error("Server is already attached to the buffer.");
        return;
      }

      const nsid = await nvim.nvim_create_namespace(denops, denops.name) as number;

      const session = {
        server: Deno.run({
          cmd: ["julia"],
          stdin: "piped",
          stdout: "piped",
        }),
        bufnr,
        namespaceId: nsid,
      };

      sessions[bufnr] = session;

      await autocmd.group(denops, "reactive-debug", (helper) => {
        helper.remove();
        helper.define(
          ["InsertLeave", "TextChanged"],
          `<buffer=${bufnr}>`,
          `call denops#notify("${denops.name}", "eval", [])`,
        );
      });

      console.log("julia server attached to the buffer.");
    },

    async eval() {
      const bufnr = await vim.bufnr(denops);
      const session = sessions[bufnr];
      const nsid = session.namespaceId;

      if (!session) {
        console.error("No server is attached to the buffer.");
        return;
      }

      const exprs = await parse(denops, session);
      debug(denops, session, exprs);

      await nvim.nvim_buf_clear_namespace(denops, bufnr, nsid, 0, -1);

      for (const expr of exprs) {
        session.server.stdin.write(encoder.encode(expr.str + "\n"));
        session.server.stdin.write(encoder.encode(":end\n"));

        for await (const line of readLines(session.server.stdout)) {
          if (line.includes(":end")) break;

          const opts = {
            virt_text: [[ line, "StatusLine" ]],
          };

          nvim.nvim_buf_set_extmark(denops, bufnr, nsid, expr.line, 0, opts);
        }
      }
    },

    async openDebugBuffer() {
      const bufnr = await vim.bufnr(denops);
      const session = sessions[bufnr];

      if (!session) {
        console.error("No server is attached to the buffer.");
        return;
      }

      const filename = await vim.expand(denops, "%:t");
      const name = bufname.format({
        scheme: "reactive",
        expr: "debug/" + filename,
      });
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
    },
  };
}
