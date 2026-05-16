import { mkdir, writeFile } from "node:fs/promises";
import { networkInterfaces } from "node:os";
import path from "node:path";
import QRCode from "qrcode";
import texts from "../data/texts.json";

function findLocalAddress() {
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal) return entry.address;
    }
  }
  return "localhost";
}

async function main() {
  const host = process.env.QR_HOST ?? findLocalAddress();
  const port = process.env.PORT ?? "3000";
  const pageIds = process.env.PAGE_ID ? [process.env.PAGE_ID] : Object.keys(texts);
  const outDir = path.join(process.cwd(), "public", "qr");
  await mkdir(outDir, { recursive: true });

  for (const pageId of pageIds) {
    const url = `http://${host}:${port}/guide/${pageId}`;
    const outPath = path.join(outDir, `${pageId}.svg`);
    const svg = await QRCode.toString(url, {
      type: "svg",
      margin: 2,
      errorCorrectionLevel: "M"
    });

    await writeFile(outPath, svg, "utf8");
    console.log(`QR code written to ${outPath}`);
    console.log(url);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
