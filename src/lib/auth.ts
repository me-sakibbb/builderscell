/** Only same-origin absolute paths, so a crafted ?next= cannot bounce people off-site. */
export function safeNext(value: string | null | undefined, fallback = "/dashboard") {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
