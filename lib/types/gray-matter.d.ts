declare module "gray-matter" {
  interface GrayMatterFile<T = string> {
    data: Record<string, unknown>;
    content: T;
    excerpt?: T;
    matter?: string;
    empty?: boolean;
    section?: string;
    language?: string;
    orig?: Buffer;
    stringify?: () => string;
  }

  interface ParseOptions {
    eval?: boolean;
    excerpt?: boolean | ((file: GrayMatterFile<string>) => string);
    excerptLen?: number;
    deserialize?: (input: string | Record<string, unknown>) => Record<string, unknown>;
    engines?: Record<string, unknown>;
    language?: string;
    section?: string;
    delimiters?: string | [string, string];
    interpolate?: boolean | RegExp;
  }

  interface StringifyOptions {
    evaluate?: boolean;
    serialize?: (matter: Record<string, unknown>, options?: StringifyOptions) => string;
    language?: string;
    section?: string;
    delimiters?: string | [string, string];
    interpolate?: boolean | RegExp;
  }

  function matter(
    input: string | Buffer,
    options?: ParseOptions
  ): GrayMatterFile<string>;

  export = matter;
}
