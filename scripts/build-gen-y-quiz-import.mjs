import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "outputs/gen-y-product-knowledge-import";
const quizTitle = "GEN-Y Product Knowledge Assessment";
const quizDescription = "Comprehensive GEN-Y product, towing technology, and jobber sales knowledge.";
const passingScore = 80;

const questions = [
  ["True or False: GEN-Y’s TORSION-FLEX Technology helps reduce driver and passenger fatigue while towing, while also reducing the stress on the assets you are towing.", [["True", true], ["False", false]]],
  ["What industries commonly use GEN-Y products?", [["Agriculture", false], ["Construction & Fleet", false], ["Recreational towing", false], ["All of the above", true]]],
  ["True or False: GEN-Y drop hitches are powder coated for corrosion resistance.", [["True", true], ["False", false]]],
  ["GEN-Y running boards are constructed & coated from what material?", [["Aluminum construction & coated with bedliner", false], ["Steel construction & coated with a high-strength dip", false], ["Aluminum construction & powder coated", false], ["Steel construction, e-coated, then powder coated", true]]],
  ["What is one benefit of offering GEN-Y display programs to jobbers?", [["Deters customers", false], ["Boosts product visibility and sales potential", true], ["Limits customer interaction", false], ["Requires paid enrollment", false]]],
  ["True or False: You have to manually latch & lock all Snap-Latch couplers before towing?", [["True", false], ["False", true]]],
  ["The GEN-Y GoosePuck GEN2 features rear puck integration with built-in safety chain attachments.", [["True", true], ["False", false]]],
  ["GEN-Y offers which items for free to new & existing jobbers?", [["Counter mats", false], ["Display Stands", false], ["Product banners", false], ["All of the above", true]]],
  ["What are the main differences between GEN-Y and competitors’ drop hitches?", [["Higher weight capacities", false], ["Larger drop sizes available", false], ["Bigger variety of accessories and versatility", false], ["All of the above", true]]],
  ["True or False: ALL of GEN-Y drop hitches can be used in the rise AND drop position?", [["True", true], ["False", false]]],
  ["Which feature helps GEN-Y hitches maintain durability in harsh environments?", [["Plastic coating", false], ["Sherwin-Williams PowDura powder coat", true], ["Chrome wrap", false], ["Spray paint finish", false]]],
  ["What competitive edge does GEN-Y offer over B&W Tow & Stow?", [["Multiple top selling SKUs that are comparable, at a lower retail price-point", false], ["Ability to add pintle towing capabilities to all MEGA-DUTY, BOSS, and PHANTOM-X", false], ["2.5” & 3” receiver drop hitches that handle up to 32,000 LB of towing capacity", false], ["All of the above", true]]],
  ["What is the difference between the MEGA-DUTY and PHANTOM drop hitch lineups?", [["PHANTOM is cheaper quality", false], ["MEGA-DUTY is steel, PHANTOM is aluminum", false], ["A patented manufacturing process drives down costs and reaches aggressive price points while maintaining the same quality standards and strength", true], ["Just the color", false]]],
  ["How long does GEN-Y’s rubber last in TORSION-FLEX Technology products?", [["50,000–60,000 miles", false], ["A lifetime lifespan, proven by customers with 350,000+ miles on the original rubber", true], ["100,000 miles", false], ["10,000 miles", false]]],
  ["What makes GEN-Y loading ramps so special?", [["100% USA-made aluminum construction that decreases handling weight", false], ["Patented dual mounting ends: curved traction end and rub rail channel mount", false], ["Weight capacities ranging from 1,200 LB up to 14,000 LB per pair", false], ["All of the above", true]]],
  ["True or False: You can tow while using GEN-Y accessories in open hitch slots?", [["True", true], ["False", false]]],
  ["What is true of the pintle saddle on the dual-ball mount?", [["It provides a more secure fit with a pintle trailer and less movement when towing", true], ["It is just for looks", false], ["The dual-ball mount offers pintle on both sides", false], ["You can tow pintle with a 10K hitch", false]]],
  ["The ¾” hole in the dual-ball mount is used for what?", [["Clevis/Hook attachment", false], ["Forage/Hay Wagon", false], ["Bolt-on 1-⅞” ball", false], ["All of the above", true]]],
  ["When connecting a Snap-Latch Gooseneck, how close to the center does the coupler need to be?", [["1” off in any direction", false], ["1.5” off in any direction", true], ["Exactly centered with no tolerances", false], ["0.5” off in any direction", false]]],
  ["How do you achieve optimal ride quality with TORSION-FLEX Technology?", [["Overload it on the first tow to break in the rubber", false], ["Ensure the trailer is in the optimal tongue weight range", true], ["Tow exactly what the hitch is rated for", false], ["Flip the hitch upside down if towing below capacity", false]]],
  ["True or False: GEN-Y offers a lifetime warranty on TORSION-FLEX products for $99.", [["True", true], ["False", false]]],
  ["True or False: The GEN-Y DOMINATOR can be used with the EXECUTIVE or SPARTAN when towing.", [["True", false], ["False", true]]],
  ["The ADMIRAL bumper coupler comes in which mounting style?", [["C-Channel", false], ["A-Frame", false], ["Flat Plate", false], ["All of the above", true]]],
  ["All ADMIRAL couplers are rated for the same weight capacity.", [["True", false], ["False", true]]],
];

const headers = ["quiz_title", "quiz_description", "passing_score", "question", "image_url", "answer", "is_correct"];
const rows = questions.flatMap(([question, answers]) => answers.map(([answer, correct]) => [quizTitle, quizDescription, passingScore, question, "", answer, correct]));

const escapeCsv = (value) => {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const csv = [headers, ...rows].map(row => row.map(escapeCsv).join(",")).join("\n") + "\n";

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(`${outputDir}/gen-y-product-knowledge-quiz-import.csv`, csv, "utf8");

const workbook = Workbook.create();
const sheet = workbook.worksheets.add("Quiz Import");
sheet.getRangeByIndexes(0, 0, rows.length + 1, headers.length).values = [headers, ...rows];
sheet.showGridLines = false;
sheet.freezePanes.freezeRows(1);
sheet.getRange(`A1:G1`).format = {
  fill: "#D9210D",
  font: { bold: true, color: "#FFFFFF" },
  rowHeight: 28,
};
sheet.getRange(`A2:G${rows.length + 1}`).format = {
  font: { color: "#222222" },
  borders: { insideHorizontal: { style: "thin", color: "#E5E5E5" } },
  verticalAlignment: "center",
};
sheet.getRange(`D2:D${rows.length + 1}`).format.wrapText = true;
sheet.getRange(`F2:F${rows.length + 1}`).format.wrapText = true;
sheet.getRange(`G2:G${rows.length + 1}`).format = { font: { bold: true, color: "#166534" } };
sheet.getRange(`A1:A${rows.length + 1}`).format.columnWidth = 34;
sheet.getRange(`B1:B${rows.length + 1}`).format.columnWidth = 42;
sheet.getRange(`C1:C${rows.length + 1}`).format.columnWidth = 14;
sheet.getRange(`D1:D${rows.length + 1}`).format.columnWidth = 72;
sheet.getRange(`E1:E${rows.length + 1}`).format.columnWidth = 18;
sheet.getRange(`F1:F${rows.length + 1}`).format.columnWidth = 52;
sheet.getRange(`G1:G${rows.length + 1}`).format.columnWidth = 14;

const inspect = await workbook.inspect({ kind: "region", sheetId: "Quiz Import", range: `A1:G${rows.length + 1}`, maxChars: 4000 });
console.log(String(inspect.ndjson ?? inspect).slice(0, 1000));
const preview = await workbook.render({ sheetName: "Quiz Import", range: "A1:G18", scale: 0.8, format: "png" });
await fs.writeFile(`${outputDir}/quiz-import-preview.png`, new Uint8Array(await preview.arrayBuffer()));
const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(`${outputDir}/gen-y-product-knowledge-quiz-import.xlsx`);

const uniqueQuestions = new Set(rows.map(row => row[3]));
const invalid = [...uniqueQuestions].filter(question => {
  const choices = rows.filter(row => row[3] === question);
  return choices.length < 2 || choices.filter(row => row[6] === true).length !== 1;
});
if (uniqueQuestions.size !== 24 || invalid.length) throw new Error(`Validation failed: ${uniqueQuestions.size} unique questions; invalid=${invalid.join(" | ")}`);
console.log(JSON.stringify({ questions: uniqueQuestions.size, answerRows: rows.length, invalidQuestions: invalid.length }));
