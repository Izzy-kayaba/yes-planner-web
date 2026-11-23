// Purpose: creates clean, branded Yes Planner PDF documents without printing the website shell.

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 42;
const WINE = [0.42, 0.15, 0.23] as const;
const INK = [0.16, 0.13, 0.13] as const;
const MUTED = [0.42, 0.36, 0.34] as const;
const LINE = [0.86, 0.8, 0.78] as const;
const SOFT = [0.97, 0.94, 0.93] as const;

type PdfRow = string[];
type PdfColor = readonly number[];

function pdfText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, "?");
}

function color(values: PdfColor, mode: "fill" | "stroke") {
  return `${values.join(" ")} ${mode === "fill" ? "rg" : "RG"}`;
}

function text(
  x: number,
  y: number,
  size: number,
  value: string,
  values: PdfColor = INK,
  bold = false,
) {
  const font = bold ? "/F2" : "/F1";
  return `${color(values, "fill")} BT ${font} ${size} Tf ${x} ${y} Td (${pdfText(value)}) Tj ET`;
}

function line(x1: number, y1: number, x2: number, y2: number, values: PdfColor = LINE, width = 1) {
  return `${color(values, "stroke")} ${width} w ${x1} ${y1} m ${x2} ${y2} l S`;
}

function rectangle(x: number, y: number, width: number, height: number, values: PdfColor) {
  return `${color(values, "fill")} ${x} ${y} ${width} ${height} re f`;
}

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function extractRows(section: string): { headers: string[]; rows: PdfRow[] } {
  const table = document.querySelector<HTMLElement>(".data-table");
  if (table) {
    const head = table.querySelector<HTMLElement>(".table-head");
    const rows = Array.from(table.querySelectorAll<HTMLElement>(".table-row"));
    const rawHeaders = head
      ? Array.from(head.children).map((cell) => clean(cell.textContent ?? ""))
      : [];
    const includedColumns = rawHeaders
      .map((header, index) => ({ header, index }))
      .filter(({ header }) => !/^actions?$/i.test(header));
    return {
      headers: includedColumns.map(({ header }) => header),
      rows: rows.map((row) =>
        Array.from(row.children)
          .map((cell, index) => ({ cell, index }))
          .filter(
            ({ index }) =>
              !rawHeaders.length || includedColumns.some((column) => column.index === index),
          )
          .map(({ cell }) => clean(cell.getAttribute("data-csv-value") ?? cell.textContent ?? "")),
      ),
    };
  }
  const seatingRows = Array.from(document.querySelectorAll<HTMLElement>(".seating-list-row"));
  if (section === "seating" && seatingRows.length) {
    return {
      headers: ["Table", "Guests", "Capacity"],
      rows: seatingRows.map((row) => {
        const cells = Array.from(row.children);
        return [
          clean(cells[0]?.textContent ?? ""),
          clean(cells[1]?.textContent ?? ""),
          clean(cells[2]?.textContent ?? ""),
        ];
      }),
    };
  }
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(
      ".budget-row, .timeline-row, .table-card, .vendor-card, .booking-card, .file-list > div, .menu-card",
    ),
  );
  return {
    headers: [],
    rows: candidates
      .map((item) => {
        const copy = item.cloneNode(true) as HTMLElement;
        copy
          .querySelectorAll("button, [role='button'], .seating-table-actions")
          .forEach((control) => control.remove());
        return [clean(copy.textContent ?? "")];
      })
      .filter(([value]) => value),
  };
}

function pageContent(
  title: string,
  weddingName: string,
  weddingDate: string,
  userName: string,
  headers: string[],
  rows: PdfRow[],
  pageNumber: number,
  totalPages: number,
) {
  const commands: string[] = [];
  commands.push(`q 52 0 0 52 ${MARGIN} ${PAGE_HEIGHT - 72} cm /Im1 Do Q`);
  commands.push(
    text(PAGE_WIDTH - MARGIN - 130, PAGE_HEIGHT - 40, 9, "WEDDING WORKSPACE", MUTED, true),
  );
  commands.push(
    text(PAGE_WIDTH - MARGIN - 130, PAGE_HEIGHT - 55, 9, "Prepared with Yes Planner", MUTED),
  );
  commands.push(line(MARGIN, PAGE_HEIGHT - 82, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 82, WINE, 1.5));
  commands.push(text(MARGIN, PAGE_HEIGHT - 122, 24, title, INK, true));
  commands.push(
    text(
      MARGIN,
      PAGE_HEIGHT - 142,
      10,
      `${weddingName || "Wedding workspace"}${weddingDate ? ` · ${weddingDate}` : ""}`,
      WINE,
      true,
    ),
  );
  commands.push(
    text(MARGIN, PAGE_HEIGHT - 158, 9, `Prepared for ${userName || "your workspace"}`, MUTED),
  );
  let y = PAGE_HEIGHT - 200;
  const usableWidth = PAGE_WIDTH - MARGIN * 2;
  if (!rows.length) {
    commands.push(rectangle(MARGIN, y - 30, usableWidth, 54, SOFT));
    commands.push(
      text(MARGIN + 16, y - 8, 11, "No records are available in this section yet.", MUTED),
    );
  } else {
    const columns = Math.max(headers.length, rows[0]?.length ?? 1);
    const widths = Array.from({ length: columns }, (_, index) =>
      index === 0 ? usableWidth * 0.34 : (usableWidth * 0.66) / Math.max(columns - 1, 1),
    );
    if (headers.length) {
      commands.push(rectangle(MARGIN, y - 22, usableWidth, 25, WINE));
      let x = MARGIN + 10;
      headers.forEach((header, index) => {
        commands.push(text(x, y - 14, 8, header.toUpperCase(), [1, 1, 1], true));
        x += widths[index] ?? widths[widths.length - 1];
      });
      y -= 25;
    }
    rows.forEach((row, rowIndex) => {
      const rowHeight = 26;
      if (rowIndex % 2 === 0)
        commands.push(rectangle(MARGIN, y - rowHeight, usableWidth, rowHeight, SOFT));
      let x = MARGIN + 10;
      row.slice(0, columns).forEach((value, index) => {
        commands.push(
          text(x, y - 16, 8.5, clean(value).slice(0, 90), index === 0 ? INK : MUTED, index === 0),
        );
        x += widths[index] ?? widths[widths.length - 1];
      });
      commands.push(line(MARGIN, y - rowHeight, PAGE_WIDTH - MARGIN, y - rowHeight));
      y -= rowHeight;
    });
  }
  commands.push(line(MARGIN, 38, PAGE_WIDTH - MARGIN, 38));
  commands.push(
    text(MARGIN, 23, 8, "Yes Planner · Wedding planning, beautifully organised", MUTED),
  );
  commands.push(
    text(PAGE_WIDTH - MARGIN - 55, 23, 8, `Page ${pageNumber} of ${totalPages}`, MUTED),
  );
  return commands.join("\n");
}

function bytes(value: string) {
  return new TextEncoder().encode(value);
}

function joinBytes(...parts: Uint8Array[]) {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

async function readWebsiteLogo() {
  const response = await fetch("/favicon/android-chrome-512x512.png");
  const png = new Uint8Array(await response.arrayBuffer());
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  let offset = 8;
  let width = 0;
  let height = 0;
  let idat = new Uint8Array(0);
  while (offset < png.length) {
    const length = view.getUint32(offset);
    const type = new TextDecoder().decode(png.slice(offset + 4, offset + 8));
    const data = png.slice(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = view.getUint32(offset + 8);
      height = view.getUint32(offset + 12);
    }
    if (type === "IDAT") idat = joinBytes(idat, data);
    offset += length + 12;
  }
  const inflated = new Uint8Array(
    await new Response(
      new Blob([idat]).stream().pipeThrough(new DecompressionStream("deflate")),
    ).arrayBuffer(),
  );
  const stride = width * 4;
  const rgb = new Uint8Array(height * (width * 3 + 1));
  const previous = new Uint8Array(stride);
  for (let row = 0; row < height; row += 1) {
    const sourceOffset = row * (stride + 1);
    const filter = inflated[sourceOffset];
    const current = inflated.slice(sourceOffset + 1, sourceOffset + 1 + stride);
    for (let index = 0; index < stride; index += 1) {
      const left = index >= 4 ? current[index - 4] : 0;
      const above = previous[index] ?? 0;
      const upperLeft = index >= 4 ? previous[index - 4] : 0;
      const predictor =
        filter === 1
          ? left
          : filter === 2
            ? above
            : filter === 3
              ? Math.floor((left + above) / 2)
              : filter === 4
                ? Math.abs(left - above) <= Math.abs(above - upperLeft) &&
                  Math.abs(left - above) <= Math.abs(left - upperLeft)
                  ? left
                  : Math.abs(above - upperLeft) <= Math.abs(left - upperLeft)
                    ? above
                    : upperLeft
                : 0;
      current[index] = (current[index] + predictor) & 255;
    }
    const targetOffset = row * (width * 3 + 1);
    rgb[targetOffset] = 0;
    for (let pixel = 0; pixel < width; pixel += 1) {
      rgb[targetOffset + 1 + pixel * 3] = current[pixel * 4];
      rgb[targetOffset + 2 + pixel * 3] = current[pixel * 4 + 1];
      rgb[targetOffset + 3 + pixel * 3] = current[pixel * 4 + 2];
    }
    previous.set(current);
  }
  const compressed = new Uint8Array(
    await new Response(
      new Blob([rgb] as unknown as BlobPart[])
        .stream()
        .pipeThrough(new CompressionStream("deflate")),
    ).arrayBuffer(),
  );
  return { width, height, bytes: compressed };
}

function buildPdf(contents: string[], logo: { width: number; height: number; bytes: Uint8Array }) {
  const imageId = contents.length * 2 + 4;
  const boldFontId = imageId + 1;
  const resultObjects: Uint8Array[] = [];
  resultObjects[1] = bytes("<< /Type /Catalog /Pages 2 0 R >>");
  resultObjects[2] = bytes(
    `<< /Type /Pages /Kids [${contents.map((_, index) => `${4 + index * 2} 0 R`).join(" ")}] /Count ${contents.length} >>`,
  );
  resultObjects[3] = bytes("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  resultObjects[boldFontId] = bytes("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  resultObjects[imageId] = joinBytes(
    bytes(
      `<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${logo.bytes.length} >>\nstream\n`,
    ),
    logo.bytes,
    bytes("\nendstream"),
  );
  contents.forEach((content, index) => {
    const pageId = 4 + index * 2;
    const contentId = pageId + 1;
    resultObjects[pageId] = bytes(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 ${boldFontId} 0 R >> /XObject << /Im1 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    resultObjects[contentId] = bytes(
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    );
  });
  const chunks: Uint8Array[] = [bytes("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n")];
  const offsets = [0];
  for (let id = 1; id < resultObjects.length; id += 1) {
    if (!resultObjects[id]) continue;
    offsets[id] = chunks.reduce((total, chunk) => total + chunk.length, 0);
    chunks.push(bytes(`${id} 0 obj\n`), resultObjects[id], bytes("\nendobj\n"));
  }
  const xref = chunks.reduce((total, chunk) => total + chunk.length, 0);
  let trailer = `xref\n0 ${resultObjects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < resultObjects.length; id += 1)
    trailer += `${String(offsets[id] ?? 0).padStart(10, "0")} 00000 n \n`;
  trailer += `trailer\n<< /Size ${resultObjects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  chunks.push(bytes(trailer));
  return new Blob(chunks as unknown as BlobPart[], { type: "application/pdf" });
}

export async function downloadWorkspacePdf(section: string, title: string) {
  const extracted = extractRows(section);
  const weddingName = clean(
    document.querySelector(".wedding-workspace-header strong")?.textContent ?? "",
  );
  const weddingDate = clean(
    document.querySelector(".wedding-workspace-header small")?.textContent ?? "",
  );
  const userName = clean(document.querySelector(".sidebar-profile strong")?.textContent ?? "");
  const rowsPerPage = 22;
  const pages = Math.max(1, Math.ceil(extracted.rows.length / rowsPerPage));
  const contents = Array.from({ length: pages }, (_, pageIndex) =>
    pageContent(
      title,
      weddingName,
      weddingDate,
      userName,
      extracted.headers,
      extracted.rows.slice(pageIndex * rowsPerPage, (pageIndex + 1) * rowsPerPage),
      pageIndex + 1,
      pages,
    ),
  );
  const blob = buildPdf(contents, await readWebsiteLogo());
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `yes-planner-${section}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
