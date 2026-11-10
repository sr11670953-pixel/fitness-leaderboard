type Level = "info" | "warn" | "error";
type Fields = Record<string, unknown>;

function write(level: Level, message: string, fields: Fields): void {
  const line = JSON.stringify({
    time: new Date().toISOString(),
    level,
    message,
    ...fields,
  });
  if (level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (message: string, fields: Fields = {}): void =>
    write("info", message, fields),
  warn: (message: string, fields: Fields = {}): void =>
    write("warn", message, fields),
  error: (message: string, fields: Fields = {}): void =>
    write("error", message, fields),
};