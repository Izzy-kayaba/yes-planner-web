import type { Guest } from "@/types";

const guestImportHeaders: Record<string, keyof Omit<Guest, "id">> = {
  name: "name",
  guest: "name",
  guestname: "name",
  fullname: "name",
  phonenumber: "phoneNumber",
  phone: "phoneNumber",
  whatsapp: "phoneNumber",
  whatsappnumber: "phoneNumber",
  email: "email",
  emailaddress: "email",
  group: "group",
  household: "group",
  guestgroup: "group",
  iscouple: "isCouple",
  couple: "isCouple",
  haschildren: "hasChildren",
  children: "hasChildren",
  status: "status",
  meal: "meal",
  mealpreference: "meal",
  table: "table",
};

function normalizeImportHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"' && quoted) {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      values.push(value.trim());
      value = "";
    } else {
      value += character;
    }
  }
  values.push(value.trim());
  return values;
}

function parseBoolean(value: string) {
  return ["true", "yes", "y", "1"].includes(value.trim().toLowerCase());
}

export function parseGuestCsv(content: string) {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());
  if (lines.length < 2) {
    throw new Error("The CSV must contain a header row and at least one guest.");
  }
  const headers = parseCsvLine(lines[0]).map(
    (header) => guestImportHeaders[normalizeImportHeader(header)],
  );
  if (!headers.includes("name") || !headers.includes("phoneNumber") || !headers.includes("group")) {
    throw new Error("CSV headings must include name, phone number, and group.");
  }
  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const row = Object.fromEntries(
      headers.map((header, column) => [header, values[column] ?? ""]).filter(([header]) => header),
    ) as Partial<Record<keyof Omit<Guest, "id">, string>>;
    const name = row.name?.trim() ?? "";
    const phoneNumber = row.phoneNumber?.trim() ?? "";
    const group = row.group?.trim() ?? "";
    if (!name || !phoneNumber || !group) {
      throw new Error(`Row ${index + 2} must include name, phone number, and group.`);
    }
    return {
      name,
      phoneNumber,
      email: row.email?.trim() ?? "",
      group,
      isCouple: parseBoolean(row.isCouple ?? ""),
      hasChildren: parseBoolean(row.hasChildren ?? ""),
      status: row.status === "Attending" || row.status === "Declined" ? row.status : "Pending",
      meal: row.meal?.trim() ?? "",
      table: row.table?.trim() ?? "",
    } satisfies Omit<Guest, "id">;
  });
}
