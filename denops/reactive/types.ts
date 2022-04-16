export type Expr = {
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

export type Server = Deno.Process<{
  cmd: [string],
  stdin: "piped",
  stdout: "piped",
}>;
