declare namespace jasmine {
  interface ArrayLikeMatchers<T> {
    toReceiveEvents(expected: any): boolean;
  }

  function arrayWithExactContents(sample: any[]): Expected<ArrayLike<string>>;
}
