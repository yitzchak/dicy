declare module 'cliui' {
  interface Column {
    text: string,
    width?: number,
    align?: 'right' | 'center',
    padding?: 'top' | 'right' | 'bottom' | 'left',
    border?: boolean
  }

  interface UI {
    div(...columns: (string | Column)[]): void,
    span(...columns: (string | Column)[]): void
  }

  interface Options {
    width?: number,
    wrap?: boolean
  }

  interface Cliui {
    (options?: Options): UI;
  }

  const cliui: Cliui;

  export = cliui;
}
