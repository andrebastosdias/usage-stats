/**
 * TierUpdate
 *
 * Calculates tier changes for formats based on usage stats
 * from 1-3 months of rated battles.
 *
 * Usage:
 *   node dist/TierUpdate.js <format> <month1-dir> [month2] [month3]
 *
 *   <format>: singles | doubles | natdex | lc | ubers
 *
 * Each month directory should contain a Stats/ subdirectory as
 * created by StatCounter, for example 2026-03/Stats/gen9ou-1695.txt
 */

import * as fs from 'fs';
import * as vm from 'vm';
import { keyify, readTable } from './common';

const GEN = 'gen9';

// BBCode for forum posts
function makeTable(table: [string, number][], name: string, keyLookup: Record<string, string>): void {
  if (table.length === 0) return;
  console.log(`[HIDE=${name}][CODE]`);
  console.log(`Combined usage for ${name}`);
  console.log('+ ---- + ------------------ + ------- +');
  console.log('| Rank | Pokemon            | Percent |');
  console.log('+ ---- + ------------------ + ------- +');
  for (let i = 0; i < table.length; i++) {
    if (table[i][1] < 0.001) break;
    const species = keyLookup[table[i][0]] ?? table[i][0];
    console.log(`| ${String(i + 1).padEnd(4)} | ${species.padEnd(18)} | ${(100.0 * table[i][1]).toFixed(3).padStart(6)}% |`);
  }
  console.log('+ ---- + ------------------ + ------- +');
  console.log('[/CODE][/HIDE]');
}

interface FormatEntry {
  tier?: string;
  doublesTier?: string;
  natDexTier?: string;
  isNonstandard?: boolean | string;
  requiredItem?: string;
}

const FORMATS_DATA_URL =
  'https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/formats-data.ts';

async function getBattleFormatsData(): Promise<Record<string, FormatEntry>> {
  const res = await fetch(FORMATS_DATA_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${FORMATS_DATA_URL}`);
  const source = await res.text();

  // strip TS type annotations
  const js = source.replace(/export const (\w+)\s*:[^=]+=/, 'exports.$1 =');

  const sandbox: Record<string, unknown> = { exports: {} };
  vm.runInNewContext(js, sandbox);
  const exports = sandbox.exports as Record<string, unknown>;

  const data = exports['FormatsData'] as Record<string, FormatEntry> | undefined;
  if (!data) throw new Error(`Could not find FormatsData export in ${FORMATS_DATA_URL}`);
  return data;
}

const SKIP_LIST = new Set([
  'pichuspikyeared','unownb','unownc','unownd','unowne','unownf','unowng','unownh',
  'unowni','unownj','unownk','unownl','unownm','unownn','unowno','unownp','unownq',
  'unownr','unowns','unownt','unownu','unownv','unownw','unownx','unowny','unownz',
  'unownem','unownqm','burmysandy','burmytrash','cherrimsunshine','shelloseast',
  'gastrodoneast','deerlingsummer','deerlingautumn','deerlingwinter','sawsbucksummer',
  'sawsbuckautumn','sawsbuckwinter','keldeoresolution','genesectdouse','genesectburn',
  'genesectshock','genesectchill','basculinbluestriped','darmanitanzen',
  'keldeoresolute','pikachucosplay',
]);

interface FormatConfig {
  tiers: string[]; // tier order from highest to lowest
  usageTiers: string[]; // same order as the tiers
  tierField: (entry: FormatEntry) => string | undefined; // which formatsData field to use
  filterNonstandard: boolean;
  nfeTiers: string[]; // NFE, LC Uber, LC
  cutoff: (tierIndex: number, tierName: string) => string;
  tableLabel: (tierName: string, cutoff: string) => string; // i.e. OU (1695 stats)
  blOverrides: Record<string, Set<string>>; // currently banned but possibly moved up since
  manualBans?: string[]; // if used, outputs a banlist instead of tier changes
}

const SINGLES: FormatConfig = {
  tiers: ['Uber','New','OU','UUBL','UU','RUBL','RU','NUBL','NU','PUBL','PU','ZUBL','ZU'],
  usageTiers: ['ou', 'uu', 'ru', 'nu', 'pu'],
  tierField: (e) => e.tier,
  filterNonstandard: true,
  nfeTiers: ['NFE','LC','LC Uber'],
  cutoff: (_i, name) => name === 'ou' ? '1695' : '1630',
  tableLabel: (name, cutoff) => {
    const labels: Record<string, string> = { ou: 'OU', uu: 'UU', ru: 'RU', nu: 'NU', pu: 'PU' };
    return `${labels[name] ?? name} (${cutoff} stats)`;
  },
  blOverrides: {
    UUBL: new Set([
      'baxcalibur','blaziken','ceruledge','espathra','garchomp','garganacl','hoopaunbound',
      'ironboulder','ironhands','kommoo','latias','meowscarada','moltresgalar','okidogi',
      'pelipper','polteageist','quaquaval','rillaboom','ursaluna','ogerponcornerstone',
      'zarude',
    ]),
    RUBL: new Set([
      'blastoise','comfey','enamorustherian','hawlucha','haxorus','hoopaunbound',
      'hydreigon','ironjugulis','ironleaves','manaphy','moltresgalar','polteageist',
      'ogerpon','oricoriopompom','salamence','serperior','thundurus','thundurustherian',
      'yanmega','zarude','zoroarkhisui','gyarados','volcanion','mamoswine','lilliganthisui',
    ]),
    NUBL: new Set([
      'armarouge','cetitan','cloyster','cresselia','deoxysdefense','feraligatr','gallade',
      'gyarados','ironthorns','lilliganthisui','lucario','lycanrocdusk','mew','mienshao',
      'necrozma','oricoriopompom','oricoriosensu','politoed','porygonz','regidrago',
      'suicune','azelf','terrakion',
    ]),
    PUBL: new Set([
      'dragalge','drednaw','duraludon','flamigo','indeedee','inteleon','oricoriopompom',
      'raikou','scyther','torterra','heracross','frosmoth',
    ]),
    ZUBL: new Set([
      'alcremie','articunogalar','bruxish','delphox','dudunsparce','electrodehisui',
      'emboar','hariyama','kingdra','oricoriosensu','porygon2','tornadus','uxie',
      'floatzel','bellossom',
    ]),
  },
};

const DOUBLES: FormatConfig = {
  tiers: ['DUber','DOU','DUUBL','DUU','DNU'],
  usageTiers: ['doublesou', 'doublesuu'],
  tierField: (e) => e.doublesTier ?? e.tier,
  filterNonstandard: true,
  nfeTiers: ['NFE','LC','LC Uber'],
  cutoff: (_i, name) => name === 'doublesou' ? '1695' : '1630',
  tableLabel: (name, cutoff) => {
    const labels: Record<string, string> = { doublesou: 'DOU', doublesuu: 'DUU' };
    return `${labels[name] ?? name} (${cutoff} stats)`;
  },
  blOverrides: {
    DUUBL: new Set([
      'basculegion','roaringmoon',
    ]),
  },
};

const NATDEX: FormatConfig = {
  tiers: ['Uber','OU','UUBL','UU','RUBL','RU'],
  usageTiers: ['nationaldex', 'nationaldexuu'],
  tierField: (e) => e.natDexTier ?? e.tier,
  filterNonstandard: false,
  nfeTiers: ['NFE','LC','LC Uber'],
  cutoff: () => '1630',
  tableLabel: (name, cutoff) => {
    const labels: Record<string, string> = { nationaldex: 'NatDex OU', nationaldexuu: 'NatDex UU' };
    return `${labels[name] ?? name} (${cutoff} stats)`;
  },
  blOverrides: {
    UUBL: new Set([
      'blaziken','charizardmegax','cinderace','dondozo','gallademega','gyarados',
      'gyaradosmega','hawlucha','hoopaunbound','ironhands','kommoo','latios','latiosmega',
      'manaphy','medichammega','meowscarada','ogerponcornerstone','pinsirmega',
      'tornadustherian','weavile','xurkitree','zapdosgalar','annihilape','baxcalibur',
      'ceruledge','espathra','kartana','kyurem','mawilemega','zamazenta','ironcrown',
      'tyranitarmega','ironmoth','okidogi',
    ]),
    RUBL: new Set([
      'aerodactylmega','alakazam','altariamega','archaludon','bisharp','blacephalon',
      'buzzwole','dondozo','enamorus','gallademega','gardevoirmega','gengar','gyarados',
      'hawlucha','heracrossmega','ironhands','ironleaves','jirachi','keldeo','keldeoresolute',
      'kyurem','latiasmega','latios','latiosmega','lilliganthisui','mamoswine','manaphy',
      'mienshao','mew','moltresgalar','okidogi','pecharunt','porygonz','quaquaval','salamence',
      'sableyemega','slowbromega','terrakion','thundurus','victini','xurkitree','zapdosgalar',
      'zoroarkhisui',
    ]),
  },
};

const LC: FormatConfig = {
  tiers: ['LC Uber','LC','LC UU'],
  usageTiers: ['lc'],
  tierField: (e) => e.tier,
  filterNonstandard: true,
  nfeTiers: ['NFE'],
  cutoff: () => '1630',
  tableLabel: (name, cutoff) => {
    const labels: Record<string, string> = { lc: 'LC' };
    return `${labels[name] ?? name} (${cutoff} stats)`;
  },
  blOverrides: {},
  manualBans: ['deerling', 'minccino'],
};

const UBERS: FormatConfig = {
  tiers: ['AG','Uber','Ubers UU'],
  usageTiers: ['ubers'],
  tierField: (e) => e.tier,
  filterNonstandard: true,
  nfeTiers: ['NFE','LC','LC Uber'],
  cutoff: () => '1630',
  tableLabel: (name, cutoff) => {
    const labels: Record<string, string> = { ubers: 'Ubers' };
    return `${labels[name] ?? name} (${cutoff} stats)`;
  },
  blOverrides: {},
  manualBans: [],
};

const FORMATS: Record<string, FormatConfig> = {
  singles: SINGLES,
  doubles: DOUBLES,
  natdex: NATDEX,
  lc: LC,
  ubers: UBERS,
};

async function runTierUpdate(config: FormatConfig, months: string[]): Promise<void> {
  const keyLookup: Record<string, string> = JSON.parse(fs.readFileSync('keylookup.json', 'utf-8'));

  const rise = [0.99999999999, 0.99999999999, 0.04515839608][months.length - 1];
  const drop = [0.01528524706, 0.02284003156, 0.04515839608][months.length - 1];

  const formatsData = await getBattleFormatsData();

  const curTiers: Record<string, string> = {};
  const NFE: string[] = [];
  const { tiers, usageTiers } = config;

  for (const poke of Object.keys(formatsData)) {
    if (SKIP_LIST.has(poke)) continue;
    const entry = formatsData[poke];
    if (config.filterNonstandard && entry.isNonstandard) continue;
    if (!('tier' in entry)) continue;

    let old = config.tierField(entry) ?? entry.tier!;
    if (config.nfeTiers.includes(old)) NFE.push(poke);
    if (old === 'Illegal' || old === 'Unreleased') continue;
    if (old.startsWith('(DU')) old = 'DNU';
    if (old.startsWith('(')) old = old.slice(1, -1);
    if (!tiers.includes(old) && !NFE.includes(poke)) old = tiers[tiers.length - 1];
    curTiers[poke] = old;
  }

  // collect usage across all tiers and months
  const usage: Record<string, number[]> = {};

  for (let i = 0; i < months.length; i++) {
    for (let j = 0; j < usageTiers.length; j++) {
      const tierName = usageTiers[j];
      const cutoff = config.cutoff(j, tierName);
      const n: Record<string, number> = {};
      const u: Record<string, Record<string, number>> = {};

      for (const suffix of ['', 'suspecttest', 'alpha', 'beta']) {
        try {
          const [tableUsage, nBattles] = readTable(`${months[i]}/Stats/${GEN}${tierName}${suffix}-${cutoff}.txt`);
          u[suffix] = tableUsage;
          n[suffix] = nBattles;
        } catch { /* file doesn't exist */ }
      }

      const ntot = Object.values(n).reduce((a, b) => a + b, 0);
      if (ntot === 0) continue;

      for (const [suffix, speciesMap] of Object.entries(u)) {
        for (const [poke, pokeUsage] of Object.entries(speciesMap)) {
          const k = keyify(poke);
          if (!(k in usage)) usage[k] = new Array(usageTiers.length).fill(0);
          if (poke !== 'empty') {
            usage[k][j] += (n[suffix] / ntot) * pokeUsage / months.length;
          }
        }
      }
    }
  }

  // print usage tables for each tier
  for (let i = 0; i < usageTiers.length; i++) {
    const tierName = usageTiers[i];
    const cutoff = config.cutoff(i, tierName);
    const table: [string, number][] = [];
    for (const [k, vals] of Object.entries(usage)) {
      if (vals[i] > 0) table.push([k, vals[i]]);
    }
    table.sort((a, b) => b[1] - a[1]);
    makeTable(table, config.tableLabel(tierName, cutoff), keyLookup);
  }

  // banlist mode: print a list of Pokemon at or above the drop threshold
  if (config.manualBans !== undefined) {
    const banlist = new Set<string>(config.manualBans);
    for (const [poke, vals] of Object.entries(usage)) {
      if (vals[0] >= drop) banlist.add(poke);
    }
    const sorted = [...banlist].sort();
    const names = sorted.map(p => keyLookup[p] ?? p);
    const label = `${tiers[tiers.length - 1]} Banlist`;
    console.log(`[b]${label}:[/b] ${names.join(', ')}`);
    return;
  }

  // rises and drops
  const newTiers: Record<string, string> = {};

  for (const poke of Object.keys(curTiers)) {
    if (!(poke in usage)) newTiers[poke] = curTiers[poke];
  }

  const playableTiers = tiers.filter(t => t !== tiers[0] && !t.includes('BL') && !t.includes('New'));
  const blAbove: Record<string, string> = {}; // the BL directly above a playable tier, if any

  for (const pt of playableTiers) {
    const idx = tiers.indexOf(pt);
    if (idx > 0 && tiers[idx - 1].includes('BL')) {
      blAbove[pt] = tiers[idx - 1];
    }
  }

  for (let i = 0; i < playableTiers.length; i++) {
    const playable = playableTiers[i];
    const bl = blAbove[playable];
    const nextPlayable = playableTiers[i + 1] ?? tiers[tiers.length - 1];
    const hasUsageData = i < usageTiers.length;

    if (bl) {
      for (const poke of Object.keys(curTiers)) {
        if (poke in newTiers) continue;
        if (curTiers[poke] === bl) newTiers[poke] = bl;
      }
    }

    if (!hasUsageData) {
      for (const poke of Object.keys(curTiers)) {
        if (poke in newTiers) continue;
        if (curTiers[poke] === playable) newTiers[poke] = playable;
      }
      continue;
    }

    // rises into this playable tier
    for (const poke of Object.keys(curTiers)) {
      if (poke in newTiers) continue;
      if (usage[poke]?.[i] > rise) newTiers[poke] = playable;
    }

    // drops out of this playable tier
    for (const poke of Object.keys(curTiers)) {
      if (poke in newTiers) continue;
      if (curTiers[poke] === playable) {
        newTiers[poke] = (usage[poke]?.[i] ?? 0) < drop ? nextPlayable : playable;
      }
    }
  }

  // the rest go in the lowest tier
  for (const poke of Object.keys(curTiers)) {
    if (!(poke in newTiers)) newTiers[poke] = tiers[tiers.length - 1];
  }

  // rises to the relevant BL if it would drop to the tier below
  for (const [blTier, pokeSet] of Object.entries(config.blOverrides)) {
    for (const poke of Object.keys(newTiers)) {
      const blIdx = tiers.indexOf(blTier);
      const tierBelow = blIdx >= 0 && blIdx + 1 < tiers.length ? tiers[blIdx + 1] : null;
      if (tierBelow && newTiers[poke] === tierBelow && pokeSet.has(poke)) {
        newTiers[poke] = blTier;
      }
    }
  }

  // sort and print changes
  type Change = [string, string, string];
  const changes: Change[] = [];
  const prefix = config === NATDEX ? 'ND' : '';

  for (const poke of Object.keys(curTiers)) {
    if (newTiers[poke] === tiers[tiers.length - 1] && NFE.includes(poke)) continue;
    if (curTiers[poke] === newTiers[poke]) continue;

    const species = keyLookup[poke] ?? poke;

    // if the base is in a higher tier
    if (species.endsWith('-Mega') || species.endsWith('-Mega-X') || species.endsWith('-Mega-Y') ||
        species.endsWith('-Mega-Z') || species.endsWith('-Primal')) {
      const base = keyify(species.slice(0, species.indexOf('-')));
      if (base in newTiers && tiers.indexOf(newTiers[base]) < tiers.indexOf(newTiers[poke])) {
        newTiers[poke] = newTiers[base];
        continue;
      }
    }

    changes.push([species, `${prefix}${curTiers[poke]}`, `${prefix}${newTiers[poke]}`]);
  }

  type SortKey = [number, number, number, string];
  const sortKey = ([, fromTier, toTier]: Change): SortKey => {
    const toRank     = tiers.indexOf(toTier.slice(prefix.length));
    const fromRank   = tiers.indexOf(fromTier.slice(prefix.length));
    const isDemotion = fromRank < toRank ? 0 : 1;
    return [toRank, isDemotion, fromRank, ''];
  };

  changes.sort((a, b) => {
    const ka = sortKey(a);
    const kb = sortKey(b);
    for (let i = 0; i < 3; i++) {
      const diff = (ka[i] as number) - (kb[i] as number);
      if (diff !== 0) return diff;
    }
    return a[0].localeCompare(b[0]);
  });

  console.log('');
  let lastToRank: number | null = null;
  let lastIsDemotion: number | null = null;

  for (const [species, fromTier, toTier] of changes) {
    const toRank     = tiers.indexOf(toTier.slice(prefix.length));
    const fromRank   = tiers.indexOf(fromTier.slice(prefix.length));
    const isDemotion = fromRank < toRank ? 0 : 1;

    if (lastToRank !== null && (toRank !== lastToRank || isDemotion !== lastIsDemotion)) {
      console.log('');
    }
    console.log(`${species} moved from ${fromTier} to ${toTier}`);
    lastToRank = toRank;
    lastIsDemotion = isDemotion;
  }
}

if (require.main === module) {
  (async () => {
    const argv = process.argv.slice(2);
    if (argv.length < 2) {
      process.stderr.write('Usage: node dist/TierUpdate.js <format> <month1-dir> [month2] [month3]\n');
      process.stderr.write('  format: singles | doubles | natdex | lc | ubers\n');
      process.exit(1);
    }
    const [format, ...months] = argv;
    const config = FORMATS[format.toLowerCase()];
    if (!config) {
      process.stderr.write(`Unknown format "${format}". Choose from: ${Object.keys(FORMATS).join(', ')}\n`);
      process.exit(1);
    }
    try {
      await runTierUpdate(config, months);
    } catch (e) {
      process.stderr.write(`${e}\n`);
      process.exit(1);
    }
  })();
}
