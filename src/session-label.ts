/** Append a Telegram label to Pi's session name; the standard footer renders it. */
export function withTelegramUsername(name: string | undefined, username: string): string {
  const label = `@${username}`;
  if (name?.split(" • ").includes(label)) return name;
  return name ? `${name} • ${label}` : label;
}
