/**
 * compare
 *
 * Shows the biggest rises and drops in set of tiers using two months of stats.
 * Originally written in R by P Squared.
 * 
 * Assumes the directory structure YYYY-MM/Stats/gen[#][tier]-[cutoff].txt
 *
 * Usage:
 *   node dist/compare.js <old-month-dir> <new-month-dir>
 */

import * as fs from 'fs';
import * as path from 'path';
import { readTable } from './common';

// config
const GEN = 'gen9';
const TIERS: [string[], number][] = [
  [['ou', 'doublesou'], 1695],
  [['ubers', 'uu', 'ru', 'nu', 'pu', 'lc', 'nationaldex'], 1630],
];
const TOP_N = 10;

interface RankedUsage {
  rank: number;
  usage: number;
}

function readRankedTable(filename: string): Map<string, RankedUsage> {
  const [usageMap] = readTable(filename);
  const sorted = Object.entries(usageMap).sort((a, b) => b[1] - a[1]);
  const result = new Map<string, RankedUsage>();
  for (const [i, [name, usage]] of sorted.entries()) {
    result.set(name, { rank: i + 1, usage });
  }
  return result;
}

interface DiffRow {
  pokemon: string;
  oldRank: number;
  newRank: number;
  oldUsage: number;
  newUsage: number;
  rankDiff: number;
  usageDiff: number;
  usagePctChange: number;
}

function printChange(
  oldFile: string,
  newFile: string,
  oldLabel: string,
  newLabel: string,
): void {
  const oldTable = readRankedTable(oldFile);
  const newTable = readRankedTable(newFile);

  const rows: DiffRow[] = [];
  for (const [pokemon, newEntry] of newTable) {
    const oldEntry = oldTable.get(pokemon);
    if (!oldEntry) continue;

    const oldUsagePct = oldEntry.usage * 100;
    const newUsagePct = newEntry.usage * 100;
    const usageDiff = newUsagePct - oldUsagePct;
    const usagePctChange = oldUsagePct !== 0
      ? Math.round((usageDiff / oldUsagePct) * 1000) / 10
      : 0;

    rows.push({
      pokemon,
      oldRank: oldEntry.rank,
      newRank: newEntry.rank,
      oldUsage: oldUsagePct,
      newUsage: newUsagePct,
      rankDiff: oldEntry.rank - newEntry.rank,
      usageDiff,
      usagePctChange,
    });
  }

  const colW = Math.max(oldLabel.length, newLabel.length, 7);

  const printRows = (subset: DiffRow[]) => {
    const rowNumW = String(subset.length).length;
    const pokeColW = 20 + rowNumW + 1;
    const pokeDashes = '-'.repeat(pokeColW);
    const colDashes = '-'.repeat(colW);
    const sep =
      `+ ${pokeDashes} + ${colDashes} + ${colDashes} + ------- + -------- + ${colDashes} + ${colDashes} + ---- +`;
    const header1 =
      `| ${''.padEnd(pokeColW)} | ${'Usage'.padEnd(colW)} | ${'Usage'.padEnd(colW)} | ` +
      `${''.padEnd(7)} | ${''.padEnd(8)} | ${'Rank'.padEnd(colW)} | ${'Rank'.padEnd(colW)} | ${'Rank'.padEnd(4)} |`;
    const header2 =
      `| ${'Pokemon'.padEnd(pokeColW)} | ${oldLabel.padEnd(colW)} | ${newLabel.padEnd(colW)} | ` +
      `${'% Diff'.padEnd(7)} | ${'% % Diff'.padEnd(8)} | ${oldLabel.padEnd(colW)} | ${newLabel.padEnd(colW)} | ` +
      `${'Diff'.padEnd(4)} |`;
    console.log(sep);
    console.log(header1);
    console.log(header2);
    console.log(sep);
    subset.forEach((row, i) => {
      const n        = String(i + 1).padStart(rowNumW);
      const pokeName = `${n} ${row.pokemon}`.padEnd(pokeColW);
      const usageDiffStr    = (row.usageDiff >= 0 ? '+' : '') + row.usageDiff.toFixed(3);
      const usagePctStr     = (row.usagePctChange >= 0 ? '+' : '') + row.usagePctChange.toFixed(1) + '%';
      const rankDiffStr     = (row.rankDiff >= 0 ? '+' : '') + row.rankDiff;
      console.log(
        `| ${pokeName} | ` +
        `${row.oldUsage.toFixed(3).padStart(colW)} | ` +
        `${row.newUsage.toFixed(3).padStart(colW)} | ` +
        `${usageDiffStr.padStart(7)} | ` +
        `${usagePctStr.padStart(8)} | ` +
        `${String(row.oldRank).padStart(colW)} | ` +
        `${String(row.newRank).padStart(colW)} | ` +
        `${rankDiffStr.padStart(4)} |`
      );
    });
    console.log(sep);
  };

  const rises = [...rows].sort((a, b) => b.usageDiff - a.usageDiff).slice(0, TOP_N);
  const drops = [...rows].sort((a, b) => a.usageDiff - b.usageDiff).slice(0, TOP_N);

  console.log('\nBiggest rises in usage:');
  printRows(rises);

  console.log('\nBiggest drops in usage:');
  printRows(drops);
}

function main(argv: string[]): void {
  const dirs = argv.slice(2);

  if (dirs.length < 2) {
    process.stderr.write('Usage: node dist/compare.js <old-month-dir> <new-month-dir>\n');
    process.exit(1);
  }

  const [oldDir, newDir] = dirs.map(d => path.join(d, 'Stats'));
  const oldLabel = dirs[0];
  const newLabel = dirs[1];

  for (const [tiers, cutoff] of TIERS) {
    for (const tier of tiers) {
      const oldFile = path.join(oldDir, `${GEN}${tier}-${cutoff}.txt`);
      const newFile = path.join(newDir, `${GEN}${tier}-${cutoff}.txt`);

      if (!fs.existsSync(oldFile)) {
        process.stderr.write(`Skipping ${tier}: not found in old dir (${oldFile})\n`);
        continue;
      }
      if (!fs.existsSync(newFile)) {
        process.stderr.write(`Skipping ${tier}: not found in new dir (${newFile})\n`);
        continue;
      }

      console.log(`\n${tier.toUpperCase()} ${'-'.repeat(40)}`);
      printChange(oldFile, newFile, oldLabel, newLabel);
    }
  }
}

main(process.argv);
