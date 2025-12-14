const fs = require("node:fs");
const path = require("node:path");

(async () => {
  const modelPath = path.join(__dirname, "../fixtures/adit-java-karin-classes.json");
  const relPath = path.join(__dirname, "../fixtures/adit-java-karin-relations.json");

  const modelJson = JSON.parse(fs.readFileSync(modelPath, "utf8"));
  const relationsJson = JSON.parse(fs.readFileSync(relPath, "utf8"));

  const mod = await import("../src/classDiagramLayout.js");
  const { layoutJson } = mod;

  const out = layoutJson(modelJson, relationsJson, { maxRowWidth: 1200, hGap: 60, vGap: 60 });

  const outJsonPath = path.join(__dirname, "../fixtures/adit-java-karin-out.json");
  fs.writeFileSync(outJsonPath, JSON.stringify(out, null, 2), "utf8");

  console.log("Wrote:", outJsonPath);
})();
