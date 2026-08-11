import { Context } from "./context.js";
import { StatWriter } from "./stat-writer.js";

const ctx = new Context();
const statWriter = new StatWriter(ctx);

// Note: CsvWriter intentionally not run by default to avoid overwriting source data.
// Uncomment below if you want to regenerate managers.csv:
// import { CsvWriter } from "./csv-writer.js";
// const csvWriter = new CsvWriter(ctx);
// csvWriter.write();

statWriter.write();
console.log(statWriter.body);
