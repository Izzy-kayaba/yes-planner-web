// Purpose: generate the worldwide country/subdivision catalog and seed-file structure.
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const sourcePath = path.join(projectRoot, ".tmp-country-region-data.json");
const catalogPath = path.join(projectRoot, "data", "country-regions.json");

if (!fs.existsSync(sourcePath)) {
  throw new Error("Download the country-region reference file before generating country data.");
}

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
if (!Array.isArray(source) || source.length === 0) {
  throw new Error("The country-region reference file must contain country records.");
}

const countries = source.map((country) => ({
  countryCode: country.countryShortCode,
  countryName: country.countryName,
  subdivisions: (country.regions ?? []).map((region) => ({
    name: region.name,
    code: region.shortCode ?? null,
  })),
}));

fs.mkdirSync(path.dirname(catalogPath), { recursive: true });
fs.writeFileSync(catalogPath, `${JSON.stringify(countries, null, 2)}\n`);

let created = 0;
for (const country of countries) {
  const filePath = path.join(projectRoot, `${country.countryCode.toLowerCase()}-data.json`);
  if (fs.existsSync(filePath)) continue;
  fs.writeFileSync(filePath, "[]\n");
  created += 1;
}

console.log(`Countries in catalog: ${countries.length}`);
console.log(`Country files created: ${created}`);
console.log(`Country files preserved: ${countries.length - created}`);
