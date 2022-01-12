
export type ExtractByType<A, type> = A extends { type: type } ? A : never;

export type ToPascal<S extends string> =
  S extends `${infer Head}_${infer Tail}`
  ? `${Capitalize<Head>}${Capitalize<ToPascal<Tail>>}`
  : Capitalize<S>;

