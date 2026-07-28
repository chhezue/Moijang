import { cookies } from "next/headers";

export function applySetCookies(setCookieHeaders: string[] | undefined) {
  if (!setCookieHeaders) return;
  const cookieStore = cookies();

  for (const raw of setCookieHeaders) {
    const [pair, ...attrs] = raw.split("; ");
    const eqIdx = pair.indexOf("=");
    const name = pair.slice(0, eqIdx);
    const value = pair.slice(eqIdx + 1);

    const options: {
      maxAge?: number;
      path?: string;
      sameSite?: "lax" | "strict" | "none";
      httpOnly?: boolean;
      secure?: boolean;
      expires?: Date;
    } = {};

    for (const attr of attrs) {
      const [key, val] = attr.split("=");
      switch (key.toLowerCase()) {
        case "max-age":
          options.maxAge = Number(val);
          break;
        case "path":
          options.path = val;
          break;
        case "expires":
          options.expires = new Date(val);
          break;
        case "samesite":
          options.sameSite = val.toLowerCase() as "lax" | "strict" | "none";
          break;
        case "httponly":
          options.httpOnly = true;
          break;
        case "secure":
          options.secure = true;
          break;
      }
    }

    const isExpired = options.expires && options.expires.getTime() <= Date.now();
    if (!value || isExpired) {
      cookieStore.delete(name);
    } else {
      cookieStore.set(name, value, options);
    }
  }
}
