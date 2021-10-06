import jsonp from "jsonp";

// They tryna make me go to callbacks but I say no, no, no
async function jsonpAsync(
  url: string,
  options?: {
    param?: string;
    prefix?: string;
    name?: string;
    timeout?: number;
  }
): Promise<Record<string, unknown>> {
  return new Promise(
    (resolve: (v: unknown) => void, reject: (reason: unknown) => void) => {
      jsonp(url, options, (error: Error | null, data: unknown) => {
        if (error != null) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    }
  ) as Promise<Record<string, unknown>>;
}

export default jsonpAsync;
