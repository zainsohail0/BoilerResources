import fs from "fs/promises";

async function fixPackageJson(filePath) {
  try {
    // Read the file
    const rawData = await fs.readFile(filePath, "utf8");

    // Parse and re-stringify to automatically fix most common JSON syntax issues
    const correctedData = JSON.stringify(JSON.parse(rawData), null, 2);

    // Write the corrected data back to the file
    await fs.writeFile(filePath, correctedData);

    console.log("package.json has been successfully corrected.");
  } catch (error) {
    console.error("Error fixing package.json:", error);
    console.error("Specific error details:", error.message);
  }
}

// Wrap the function call in an immediately invoked async function
(async () => {
  await fixPackageJson("./package.json");
})();
