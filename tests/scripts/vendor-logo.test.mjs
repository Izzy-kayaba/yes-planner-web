// Purpose: verifies seeded logo URL and image validation before public media storage.
import assert from "node:assert/strict";
import test from "node:test";
import {
  detectLogoContentType,
  downloadLogo,
  normalizeLogoSourceUrl,
} from "../../scripts/vendor-logo.mjs";

const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

test("accepts only explicit HTTPS logo sources", () => {
  assert.equal(
    normalizeLogoSourceUrl("https://example.com/logo.png"),
    "https://example.com/logo.png",
  );
  assert.equal(normalizeLogoSourceUrl(""), null);
  assert.throws(() => normalizeLogoSourceUrl("http://example.com/logo.png"), /HTTPS/);
});

test("validates supported image signatures", () => {
  assert.equal(detectLogoContentType(pngHeader, "image/png"), "image/png");
  assert.equal(detectLogoContentType(Buffer.from("not an image"), "image/png"), null);
  assert.equal(
    detectLogoContentType(
      Buffer.from('<?xml version="1.0"?><svg viewBox="0 0 1 1"/>'),
      "image/svg+xml",
    ),
    "image/svg+xml",
  );
});

test("downloads a small supported logo and rejects invalid responses", async () => {
  const response = {
    ok: true,
    status: 200,
    headers: new Headers({
      "content-type": "image/png",
      "content-length": String(pngHeader.length),
    }),
    arrayBuffer: async () => pngHeader,
  };
  const logo = await downloadLogo("https://example.com/logo.png", async () => response);
  assert.equal(logo.contentType, "image/png");
  assert.deepEqual(logo.buffer, pngHeader);
  const svgResponse = {
    ...response,
    headers: new Headers({ "content-type": "image/svg+xml" }),
    arrayBuffer: async () => Buffer.from("<svg></svg>"),
  };
  const svgLogo = await downloadLogo("https://example.com/logo.svg", async () => svgResponse);
  assert.equal(svgLogo.contentType, "image/svg+xml");
});
