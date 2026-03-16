# usage-stats

Scripts for compiling usage stats from Smogon's Pokemon Showdown server.

Each month, Smogon's PS server logs millions of battles across dozens of metagames. These scripts read in those logs and distill them into usage statistics, from the simple counts used for tiering to detailed moveset and metagame statistics. The method for this boils down to the following:

1. Assume that logs are stored in the /logs/ folder (I'll be assuming a UNIX system) and that you've cloned this repo into the /usage-stats/ folder. The /logs/ folder should be subdivided first by month, then by metagame, then by day. So Little Cup battles from March 4, 2026 will be found in: /logs/2026-03/gen9lc/2026-03-04/

2. batchLogReader is written to loop over all PS logs stored in one of these subdirectories and gather any relevant information into intermediate files using the gzip library to compress the data, which will be stored in the /usage-stats/Raw/ folder. Since batchLogReader is designed to process single log subfolders at a time, it can be run nightly, cutting down on the amount of processing that needs to be done at the end of the month.

3. At the end of the month, once all the logs are "read" by batchLogReader and processed into intermediate files, which are stored in /usage-stats/Raw/, we run StatCounter, which reads in the intermediate file and does all the counting necessary to generate usage statistics, lead statistics, and metagame analyses. These are generated into the /usage-stats/Stats/ folder. StatCounter also generates additional moveset information, namely teammate data and the so-called "encounterMatrix" which is used to determine checks and counters.

4. Once StatCounter has run its course, batchMovesetCounter may be run to generate detailed moveset statistics for any Pokemon that appears on at least 0.01% of teams. This script depends on StatCounter having already been run (otherwise, there will be missing files).

---

## Requirements

- Node.js >= 18
- npm

Install dependencies and build before each run:

```bash
npm install
npm run build
```

Compiled output goes to `dist/`. The rest of the commands assume `npm run build` has been done.

---

## Sample usage

Logs are assumed to be in `/logs/YYYY-MM/<tier>/YYYY-MM-DD/`

### 1. Process battle logs

```bash
node dist/batchLogReader.js /logs/2026-03/gen9ou/2026-03-04/ gen9ou
```

### 2. Generate usage stats

Standard weighted cutoff:

```bash
node dist/StatCounter.js gen9ou
node dist/StatCounter.js gen9ou 1500
```

Unweighted:

```bash
node dist/StatCounter.js gen9ou 0
```

### 3. Generate moveset stats

```bash
node dist/batchMovesetCounter.js gen9ou 1695 > Stats/moveset/gen9ou-1695.txt
```

### 4. Generate tier updates

From one to three months of usage, after moving the Stats output directory into a YYYY-MM directory:
```bash
node dist/TierUpdate.js <format> 2026-01                 # 1.53% quick drop
node dist/TierUpdate.js <format> 2026-01 2026-02         # 2.28% quick drop
node dist/TierUpdate.js <format> 2026-01 2026-02 2026-03 # 4.52% rise/drop
```
where `<format>` is one of: `singles`, `doubles`, `natdex`, `lc`, `ubers`

### 5. Compare two months of usage output

```bash
node dist/compare.js 2026-01 2026-02
```

## Monthly runs

`RunMonthly.sh` processes a day range (edit the `month` and `for d in` line as needed) then calls `MonthlyAnalysis.sh`. Both scripts accept a `--partial` flag that processes the days and generates 1630/1695 stats only, skipping 0, 1500, and 1760/1825 stats, monotype analysis, and output compression for backing up.

```bash
./RunMonthly.sh           # full run, including output compression
./RunMonthly.sh --partial # only outputs 1630/1695 files for each tier
```

`MonthlyAnalysis.sh` can also be called directly with the same flag if the log
processing has already been done:

```bash
./MonthlyAnalysis.sh           # outputs Stats for all cutoffs
./MonthlyAnalysis.sh --partial # only 1630/1695 files
```
