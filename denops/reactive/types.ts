export type Session = {
  server: Deno.Process<{
    cmd: [string],
    stdin: "piped",
    stdout: "piped",
  }>;
  bufnr: number;
  namespaceId: number;
  debugBufnr?: number;
}

export type FlattenSyntaxTree = {
  type: string;
  range: Range;
  identifiers: Identifier[];
};

export type Identifier = {
  range: Range;
};

export type Range = {
  start: Position;
  end: Position;
};

export type Position = {
  row: number;
  col: number;
};

export type Expr = {
  str: string;
  end: number;
}
