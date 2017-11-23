declare module 'string-width' {
  interface StringWidth {
    (text: string): number;
  }

  const StringWidth: StringWidth;

  export = StringWidth;
}
