import { mkdir, writeFile } from "node:fs/promises";
import { networkInterfaces } from "node:os";
import path from "node:path";
import QRCode from "qrcode";

function findLocalAddress() {
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal) return entry.address;
    }
  }
  return "localhost";
}

async function main() {
  const baseUrl = process.env.QR_BASE_URL
    ?? `http://${process.env.QR_HOST ?? findLocalAddress()}:${process.env.PORT ?? "3000"}`;
  const outDir = path.join(process.cwd(), "public", "qr");
  await mkdir(outDir, { recursive: true });

  const url = `${baseUrl}/see-saw`;
  const outPath = path.join(outDir, "see-saw.svg");
  const svg = await QRCode.toString(url, {
    type: "svg",
    margin: 2,
    errorCorrectionLevel: "M"
  });

  await writeFile(outPath, svg, "utf8");
  console.log(`QR code written to ${outPath}`);
  console.log(url);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
