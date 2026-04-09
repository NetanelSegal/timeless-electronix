import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { Product } from "../models/Product.js";

interface CsvRow {
  part_number: string;
  description: string;
  quantity: string;
  our_reference: string;
  mfg: string;
  dc: string;
  id: string;
  created_date: string;
  updated_date: string;
  created_by_id: string;
  created_by: string;
  is_sample: string;
}

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected.");

  const csvPath = path.resolve(
    import.meta.dirname,
    "..",
    "..",
    "..",
    "Product_export.csv",
  );

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV not found at ${csvPath}`);
    process.exit(1);
  }

  console.log("Parsing CSV...");
  const rows: CsvRow[] = await new Promise((resolve, reject) => {
    const results: CsvRow[] = [];
    fs.createReadStream(csvPath)
      .pipe(parse({ columns: true, skip_empty_lines: true, trim: true }))
      .on("data", (row: CsvRow) => results.push(row))
      .on("end", () => resolve(results))
      .on("error", reject);
  });

  console.log(`Parsed ${rows.length} rows. Inserting into DB...`);

  await Product.deleteMany({});

  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE).map((row) => ({
      partNumber: row.part_number,
      description: row.description,
      quantity: parseInt(row.quantity, 10) || 0,
      ourReference: row.our_reference,
      manufacturer: row.mfg,
      dateCode: row.dc,
      isSample: row.is_sample === "true",
    }));

    await Product.insertMany(batch);
    inserted += batch.length;
    console.log(`  Inserted ${inserted}/${rows.length}`);
  }

  console.log("Seed complete!");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
