declare module "tosource" {
  interface ToSource {
    (x: any): string;
  }

  const toSource: ToSource;

  export = toSource;

}
