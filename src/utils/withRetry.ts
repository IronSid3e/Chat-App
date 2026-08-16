const TRANSIENT_ERROR_PATTERN = /JWT not yet valid|JWT expired|token has expired/i;

export async function withAuthRetry<T>(
  fn: () => PromiseLike<T>,
  retries = 3,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      const message = e?.message ?? String(e);
      const transient = TRANSIENT_ERROR_PATTERN.test(message);
      if (!transient || attempt >= retries) throw e;
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }
}
