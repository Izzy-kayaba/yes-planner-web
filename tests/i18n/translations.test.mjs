import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import { getLiteralMessageKey, literalMessages } from "../../lib/i18n-literals.ts";

const projectRoot = process.cwd();
const uiRoots = ["app", "components", "features"];
const nonInterfaceCopy = new Set([
  "TM",
  "AN",
  "SK",
  "VOGUE",
  "WEDDING",
  "THE KNOT",
  "BRIDES",
  "Yes",
  "Planner",
  "Google",
  "Instagram",
  "KM",
  "ZN",
  "JL",
  "Karabo & Musa",
  "Zinhle & Neo",
  "Julia & Lesedi",
  "KN",
  "NS",
  "Karabo & Neo",
  "Nandi & Sam",
  "Jessica & Liam",
  "RM",
  "SM",
  "LM",
  "Lerato",
  "Izzy",
  "Naledi Molefe",
]);
const nonInterfaceAttributes = new Set([
  "Alex",
  "Morgan",
  "you@example.com",
  "••••••••••••",
  "https://",
  "@business",
]);
const translatedComponentProps = {
  ActionButton: new Set(["message", "doneLabel"]),
  LocalizedText: new Set(["value"]),
  Modal: new Set(["description", "title"]),
  PageHeader: new Set(["description", "eyebrow", "title"]),
  StatCard: new Set(["detail", "label"]),
};

function collectUiFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectUiFiles(absolutePath);
    return /\.tsx?$/.test(entry.name) ? [absolutePath] : [];
  });
}

function collectLiteralTranslationCalls(sourceFile) {
  const missing = [];

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "text"
    ) {
      const argument = node.arguments[0];
      if (
        argument &&
        (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument)) &&
        !getLiteralMessageKey(argument.text)
      ) {
        const position = sourceFile.getLineAndCharacterOfPosition(argument.getStart(sourceFile));
        missing.push(`${sourceFile.fileName}:${position.line + 1}: ${argument.text}`);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return missing;
}

function collectUntranslatedJsxText(sourceFile) {
  const missing = [];

  function visit(node) {
    if (ts.isJsxText(node)) {
      const value = node.getText(sourceFile).replace(/\s+/g, " ").trim();
      if (
        value &&
        /[A-Za-z]{2}/.test(value) &&
        !nonInterfaceCopy.has(value) &&
        !getLiteralMessageKey(value)
      ) {
        const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        missing.push(`${sourceFile.fileName}:${position.line + 1}: ${value}`);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return missing;
}

function collectUntranslatedJsxAttributes(sourceFile) {
  const missing = [];

  function visit(node) {
    const openingElement = node.parent?.parent;
    const componentName =
      openingElement &&
      ts.isJsxOpeningElement(openingElement) &&
      ts.isIdentifier(openingElement.tagName)
        ? openingElement.tagName.text
        : "";
    const attributeName = ts.isJsxAttribute(node) ? node.name.getText(sourceFile) : "";
    const isTranslatedComponentProp = translatedComponentProps[componentName]?.has(attributeName);
    if (
      ts.isJsxAttribute(node) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer) &&
      (["aria-label", "alt", "placeholder", "title"].includes(attributeName) ||
        isTranslatedComponentProp)
    ) {
      const value = node.initializer.text.trim();
      if (value && !nonInterfaceAttributes.has(value) && !getLiteralMessageKey(value)) {
        const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        missing.push(`${sourceFile.fileName}:${position.line + 1}: ${value}`);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return missing;
}

test("English and French literal catalogs contain the same message keys", () => {
  assert.deepEqual(Object.keys(literalMessages.en).sort(), Object.keys(literalMessages.fr).sort());
});

test("fixed visible JSX text is translated or is known brand/demo data", () => {
  const missing = uiRoots
    .flatMap((directory) => collectUiFiles(path.join(projectRoot, directory)))
    .flatMap((file) => {
      const source = fs.readFileSync(file, "utf8");
      const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
      return collectUntranslatedJsxText(sourceFile);
    });

  assert.deepEqual(missing, []);
});

test("fixed accessibility labels, image descriptions, and titles are translated", () => {
  const missing = uiRoots
    .flatMap((directory) => collectUiFiles(path.join(projectRoot, directory)))
    .flatMap((file) => {
      const source = fs.readFileSync(file, "utf8");
      const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
      return collectUntranslatedJsxAttributes(sourceFile);
    });

  assert.deepEqual(missing, []);
});

test("every fixed text() message used by the UI has a French translation", () => {
  const missing = uiRoots
    .flatMap((directory) => collectUiFiles(path.join(projectRoot, directory)))
    .flatMap((file) => {
      const source = fs.readFileSync(file, "utf8");
      const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
      return collectLiteralTranslationCalls(sourceFile);
    });

  assert.deepEqual(missing, []);
});
