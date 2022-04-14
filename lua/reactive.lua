local function add_identifier(list, node)
  if node:child_count() == 0 then
    if node:type() == "identifier" then
      local startRow, startCol, endRow, endCol = node:range()
      table.insert(list, { startRow, startCol, endRow, endCol })
    end
  else
    for child, _ in node:iter_children() do
      add_identifier(list, child)
    end
  end
end

local parse_buffer = function()
  local parser = vim.treesitter.get_parser()
  local tstree = parser:parse()

  assert(#tstree == 1)

  local root = tstree[1]:root()
  local exprs = {}

  for child, _ in root:iter_children() do
    local ids = {}
    add_identifier(ids, child)

    if #ids > 0 then
      local startRow, startCol, endRow, endCol = child:range()
      table.insert(exprs, {
        type = child:type(),
        range = { startRow, startCol, endRow, endCol },
        identifiers = ids
      })
    end
  end

  return exprs
end

return {
  parse_buffer = parse_buffer
}
