function escapeCsvValue(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

export function buildCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: Array<{ key: keyof T; header: string }>
) {
  const header = columns.map((column) => escapeCsvValue(column.header)).join(",");
  const lines = rows.map((row) =>
    columns
      .map((column) => {
        const value = row[column.key];
        if (value == null) {
          return "";
        }

        if (Array.isArray(value) || typeof value === "object") {
          return escapeCsvValue(JSON.stringify(value));
        }

        return escapeCsvValue(String(value));
      })
      .join(",")
  );

  return [header, ...lines].join("\n");
}
