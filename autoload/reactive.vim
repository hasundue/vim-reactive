function! reactive#attach() abort
  return denops#notify('reactive', 'attach', [])
endfunction

function! reactive#debug() abort
  return denops#notify('reactive', 'openDebugBuffer', [])
endfunction

