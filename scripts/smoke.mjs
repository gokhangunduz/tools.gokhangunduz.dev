
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3001";

const registry = readFileSync(
  new URL("../src/tools/components.ts", import.meta.url),
  "utf8",
);
const ids = [
  ...registry.matchAll(/^\s+(?:"([^"]+)"|([a-zA-Z0-9]+)):\s*dynamic/gm),
].map((match) => match[1] ?? match[2]);

if (ids.length === 0) {
  console.error("No tools found in components.ts");
  process.exit(1);
}

const NETWORK = new Set(["dns-lookup", "ip-geo"]);

const FILE_INPUT = new Set(["image-base64", "image-convert"]);

const browser = await chromium.launch();
const failures = [];
let checked = 0;

for (const locale of ["tr", "en"]) {
  for (const id of ids) {
    const page = await browser.newPage();
    const problems = [];

    page.on("console", (message) => {
      if (message.type() !== "error") return;

      if (
        NETWORK.has(id) &&
        message.text().startsWith("Failed to load resource")
      )
        return;
      problems.push(`console: ${message.text()}`);
    });
    page.on("pageerror", (error) =>
      problems.push(`pageerror: ${error.message}`),
    );

    const url = `${BASE}/${locale}/${id}`;
    try {
      const response = await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 30_000,
      });
      if (!response || response.status() >= 400) {
        problems.push(`http ${response?.status()}`);
      }

      await page.waitForSelector("h1", { timeout: 10_000 });

      if (!FILE_INPUT.has(id)) {
        const sample = page.getByRole("button", {
          name: locale === "tr" ? "Örnek" : "Sample",
          exact: true,
        });
        if (await sample.count()) {
          await sample.first().click();
          await page.waitForTimeout(900);
        }

        const alert = page.locator("[data-tool-error]");
        if (!NETWORK.has(id) && (await alert.count())) {
          problems.push(
            `error shown: ${(await alert.first().innerText()).slice(0, 120)}`,
          );
        }

        if (!NETWORK.has(id)) {
          const output = page.locator("textarea[readonly]");
          if (await output.count()) {
            const value = await output.first().inputValue();
            if (!value.trim())
              problems.push("output stayed empty after the sample");
          }
        }
      }
    } catch (error) {
      problems.push(`threw: ${String(error).split("\n")[0].slice(0, 160)}`);
    }

    await page.close();
    checked += 1;
    if (problems.length > 0) {
      failures.push({ url, problems });
      process.stdout.write("✗");
    } else {
      process.stdout.write(".");
    }
  }
}

await browser.close();

console.log(`\n\n${checked} pages checked, ${failures.length} with problems.`);
for (const failure of failures) {
  console.log(`\n${failure.url}`);
  for (const problem of failure.problems) console.log(`  ${problem}`);
}

process.exit(failures.length > 0 ? 1 : 0);
