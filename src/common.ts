/**
 * common
 * 
 * Shared utilities and commonly used data.
 */

import * as fs from 'fs';

export interface UsageTable {
  [species: string]: number;
}

// lowercase and strip non-alphanumeric characters
const nonKeyRegex = /[^a-z0-9]+/g;
export function keyify(s: string | null | undefined): string {
  if (s == null) return '';
  return s.toLowerCase().replace(nonKeyRegex, '');
}

// our weighting function
export function weighting(rating: number, deviation: number, cutoff: number): number {
  if (deviation > 100 && cutoff > 1500) {
    return 0.0;
  }
  return (erf((rating - cutoff) / deviation / Math.sqrt(2.0)) + 1.0) / 2.0;
  // return victoryChance(rating, deviation, cutoff, 0.0);

  // s = Math.sqrt(3.0) * deviation / Math.PI;
  // return (Math.tanh((rating - cutoff) / s / 2.0) + 1.0) / 2.0; // this is for logistic weighting

  // b = Math.sqrt(6.0) * deviation / Math.PI;
  // return 1.0 - Math.exp(-Math.exp(-(cutoff - rating) / b)); // this is for extreme value weighting
}

// if (r2, d2) = (1500, 350) this becomes the GXE formula
export function victoryChance(r1: number, d1: number, r2: number, d2: number): number {
  const C = (3.0 * Math.pow(Math.log(10.0), 2.0)) / Math.pow(400.0 * Math.PI, 2);
  return 1.0 / (1.0 + Math.pow(10.0, ((r2 - r1) / 400.0) / Math.sqrt(1.0 + C * (d1 * d1 + d2 * d2))));
}

// error function approximation using Abramowitz & Stegun formula 7.1.26
export function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

export function readTable(filename: string): [UsageTable, number] {
  const lines = fs.readFileSync(filename, 'utf-8').split('\n');
  const usage: UsageTable = {};

  const nBattles = parseInt(lines[0].slice(15), 10);

  for (let i = 5; i < lines.length; i++) {
    const parts = lines[i].split('|');
    if (parts.length < 3) break;

    let name = parts[2].slice(1);
    while (name.endsWith(' ')) {
      name = name.slice(0, name.length - 1);
    }

    const pctStr = parts[3].slice(1, parts[3].indexOf('%'));
    usage[name] = parseFloat(pctStr) / 100.0;
  }

  return [usage, nBattles];
}

export const aliases: Record<string, string[]> = {
  'NidoranF': ['Nidoran-F'],
  'NidoranM': ['Nidoran-M'],
  'Wormadam-Sandy': ['Wormadam-S','Wormadamsandy'],
  'Wormadam-Trash': ['Wormadam-G','Wormadamtrash'],
  'Giratina-Origin': ['Giratina-O'],
  'Unown': ['Unown-B','Unown-C','Unown-D','Unown-E','Unown-F','Unown-G','Unown-H','Unown-I','Unown-J','Unown-K','Unown-L','Unown-M','Unown-N','Unown-O','Unown-P','Unown-Q','Unown-R','Unown-S','Unown-T','Unown-U','Unown-V','Unown-W','Unown-X','Unown-Y','Unown-Z','Unown-Exclamation','Unown-Question','Unownb','Unownc','Unownd','Unowne','Unownf','Unowng','Unownh','Unowni','Unownj','Unownk','Unownl','Unownm','Unownn','Unowno','Unownp','Unownq','Unownr','Unowns','Unownt','Unownu','Unownv','Unownw','Unownx','Unowny','Unownz','Unownexclamation','Unownquestion'],
  'Burmy': ['Burmy-G','Burmy-S','Burmy-Sandy','Burmysandy','Burmy-Trash','Burmytrash'],
  'Castform': ['Castform-Snowy','Castform-Rainy','Castform-Sunny'],
  'Cherrim': ['Cherrim-Sunshine'],
  'Shellos': ['Shellos-East','Shelloseast'],
  'Gastrodon': ['Gastrodon-East','Gastrodoneast'],
  'Deerling': ['Deerling-Summer','Deerling-Autumn','Deerling-Winter','Deerlingsummer','Deerlingautumn','Deerlingwinter'],
  'Sawsbuck': ['Sawsbuck-Summer','Sawsbuck-Autumn','Sawsbuck-Winter','Sawsbucksummer','Sawsbuckautumn','Sawsbuckwinter'],
  'Tornadus-Therian': ['Tornadus-T'],
  'Thundurus-Therian': ['Thundurus-T'],
  'Landorus-Therian': ['Landorus-T'],
  'Keldeo': ['Keldeo-R','Keldeo-Resolution','Keldeo-Resolute','Keldeoresolute'],
  'Meloetta': ['Meloetta-S','Meloetta-Pirouette','Meloettapirouette'],
  'Genesect': ['Genesect-Douse','Genesect-Burn','Genesect-Shock','Genesect-Chill','Genesect-D','Genesect-S','Genesect-B','Genesect-C','Genesectdouse','Genesectburn','Genesectshock','Genesectchill'],
  'Basculin': ['Basculin-Blue-Striped','Basculin-A','Basculinbluestriped','Basculin-White-Striped','Basculinwhitestriped'],
  'Kyurem-Black': ['Kyurem-B'],
  'Kyurem-White': ['Kyurem-W'],
  'Pichu': ['Pichu-Spiky-eared','Spiky Pichu','Pichuspikyeared','Spikypichu'],
  'Rotom-Heat': ['Rotom-H','Rotom- H','Rotom-h'],
  'Rotom-Wash': ['Rotom-W','Rotom -W','Rotom-w'],
  'Rotom-Frost': ['Rotom-F','Rotom -F','Rotom-f'],
  'Rotom-Fan': ['Rotom-S','Rotom -S','Rotom-s'],
  'Rotom-Mow': ['Rotom-C','Rotom -C',' Rotom-c'],
  'Deoxys-Defense': ['Deoxys-D'],
  'Deoxys-Attack': ['Deoxys-A'],
  'Deoxys-Speed': ['Deoxys-S'],
  'Shaymin-Sky': ['Shaymin-S'],
  'Ho-Oh': ['Ho-oh'],
  'Virizion': ['Birijion'],
  'Terrakion': ['Terakion'],
  'Accelgor': ['Agirudaa'],
  'Landorus': ['Randorosu'],
  'Volcarona': ['Urugamosu'],
  'Whimsicott': ['Erufuun'],
  'Excadrill': ['Doryuuzu'],
  'Jellicent': ['Burungeru'],
  'Ferrothorn': ['Nattorei','Ferry'],
  'Chandelure': ['Shadera'],
  'Conkeldurr': ['Roobushin'],
  'Haxorus': ['Ononokusu'],
  'Hydreigon': ['Sazandora'],
  'Cinccino': ['Chirachiino'],
  'Kyurem': ['Kyuremu'],
  'Serperior': ['Jarooda'],
  'Zoroark': ['Zoroaaku'],
  'Mandibuzz': ['Barujiina'],
  'Reuniclus': ['Rankurusu','Rank'],
  'Thundurus': ['Borutorosu'],
  'Mime Jr.': ['Mime Jr'],
  'Dragonite': ['Dnite'],
  'Forretress': ['Forry'],
  'Lucario': ['Luke'],
  'Porygon2': ['P2','Pory2'],
  'Porygon-Z': ['Pz','Poryz','PorygonZ'],
  'Tyranitar': ['Ttar'],
  'Pumpkaboo': ['Pumpkaboo-Average','Pumpkabooaverage'],
  'Gourgeist': ['Gourgeist-Average','Gourgeistaverage'],
  'Aegislash': ['Aegislash-Blade','Aegislashblade'],
  'Floette-Eternal': ['Floetteeternalflower','Floetteeternal'],
  'Floette-Mega': ['Floetteeternalmega','Floette-Eternal-Mega','Floette-Eternalmega'],
  'Pikachu': ['Pikachu-Cosplay','Pikachu-Belle','Pikachu-Rock-Star','Pikachu-Pop-Star','Pikachu-PhD','Pikachu-Libre','Pikachu-Original','Pikachu-Hoenn','Pikachu-Sinnoh','Pikachu-Unova','Pikachu-Kalos','Pikachu-Alola','Pikachu-Partner','Pikachu-World'],
  'Meowstic': ['Meowstic-F','Meowstic-M','Meowsticf','Meowsticm'],
  'Bisharp': ['Bsharp'],
  'Missingno.': ['MissingNo.','MissingNo','Missingno'],
  'Vivillon': ['Vivillon-Archipelago','Vivillon-Continental','Vivillon-Elegant','Vivillon-Garden','Vivillon-Highplains','Vivillon-Icysnow','Vivillon-Jungle','Vivillon-Marine','Vivillon-Modern','Vivillon-Monsoon','Vivillon-Ocean','Vivillon-Polar','Vivillon-River','Vivillon-Sandstorm','Vivillon-Savanna','Vivillon-Sun','Vivillon-Tundra','Vivillon-Fancy','Vivillon-Pokeball','Vivillonarchipelago','Vivilloncontinental','Vivillonelegant','Vivillongarden','Vivillonhighplains','Vivillonicysnow','Vivillonjungle','Vivillonmarine','Vivillonmodern','Vivillonmonsoon','Vivillonocean','Vivillonpolar','Vivillonriver','Vivillonsandstorm','Vivillonsavanna','Vivillonsun','Vivillontundra','Vivillonfancy','Vivillonpokeball','Vivillon-Icy Snow','Vivillon-High Plains'],
  'Flabebe': ['Flabebeblue','Flabebeorange','Flabebewhite','Flabebeyellow','Flabebe-Blue','Flabebe-Orange','Flabebe-White','Flabebe-Yellow','Flabe\u0301be\u0301','Flabe\u0301be\u0301-Blue','Flabe\u0301be\u0301-Orange','Flabe\u0301be\u0301-White','Flabe\u0301be\u0301-Yellow'],
  'Floette': ['Floetteblue','Floetteorange','Floettewhite','Floetteyellow','Floette-Blue','Floette-Orange','Floette-White','Floette-Yellow'],
  'Florges': ['Florgesblue','Florgesorange','Florgeswhite','Florgesyellow','Florges-Blue','Florges-Orange','Florges-White','Florges-Yellow'],
  'Furfrou': ['Furfroudandy','Furfroudebutante','Furfroudiamond','Furfrouheart','Furfroukabuki','Furfroulareine','Furfroumatron','Furfroupharaoh','Furfroustar','Furfrou-Dandy','Furfrou-Debutante','Furfrou-Diamond','Furfrou-Heart','Furfrou-Kabuki','Furfrou-La Reine','Furfrou-Lareine','Furfrou-Matron','Furfrou-Pharaoh','Furfrou-Star'],
  'Ditto': ['Dtto'],
  'Magearna': ['Magearnaoriginal','Magearna-Original'],
  'Magearna-Mega': ['Magearnaoriginalmega','Magearna-Original-Mega'],
  'Minior': ['Miniororange','Minioryellow','Miniorgreen','Miniorblue','Miniorindigo','Miniorviolet','Minior-Orange','Minior-Yellow','Minior-Green','Minior-Blue','Minior-Indigo','Minior-Violet'],
  'Zygarde-10%': ['Zydog','Zygardedog','Zygarde-Dog'],
  'Zygarde': ['Zygarde-50%','Zygarde50'],
  'Zygarde-Complete': ['Zyc','Zygarde-100%','Zygarde100','Zygarde-C','Zygarde-Full','Zygod','Perfect-Zygarde'],
  'Oricorio': ['Oricorio-Baile','Oricoriobaile'],
  'Oricorio-Sensu': ['Oricorio-S'],
  'Lycanroc': ['Lycanroc-Midday','Lycanrocmidday','Lycanroc-Day','Lycanrocday'],
  'Lycanroc-Midnight': ['Lycanroc-Night','Lycanrocnight'],
  'Toxtricity': ['Toxtricity-Low-Key','Toxtricitylowkey','Toxtricity-Lowkey'],
  'Eiscue': ['Eiscue-Noice','Eiscuenoice'],
  'Sinistea': ['Sinistea-Antique','Sinisteaantique'],
  'Polteageist': ['Polteageist-Antique','Polteageistantique'],
  'Morpeko': ['Morpeko-Hangry','Morpekohangry'],
  'Alcremie': ['Alcremierubycream','Alcremiematchacream','Alcremiemintcream','Alcremielemoncream','Alcremiesaltedcream','Alcremierubyswirl','Alcremiecaramelswirl','Alcremierainbowswirl','Alcremiematcha','Alcremiemint','Alcremielemon','Alcremiesalted','Alcremiecaramel','Alcremierainbow','Alcremie-Ruby-Cream','Alcremie-Matcha-Cream','Alcremie-Mint-Cream','Alcremie-Lemon-Cream','Alcremie-Salted-Cream','Alcremie-Ruby-Swirl','Alcremie-Caramel-Swirl','Alcremie-Rainbow-Swirl','Alcremie-Matcha','Alcremie-Mint','Alcremie-Lemon','Alcremie-Salted','Alcremie-Caramel','Alcremie-Rainbow','Alcremie-Rubycream','Alcremie-Matchacream','Alcremie-Mintcream','Alcremie-Lemoncream','Alcremie-Saltedcream','Alcremie-Rubyswirl','Alcremie-Caramelswirl','Alcremie-Rainbowswirl'],
  'Pokestargiant': ['Pokestargiant2','Pokestargiantpropo1','Pokestargiantpropo2','Pokestar Giant-2','Pokestar Giant-PropO1','Pokestar Giant-PropO2'],
  'Pokestarufo': ['Pokestarufopropu1','Pokestar UFO-PropU1'],
  'Pokestarbrycenman': ['Pokestarbrycenmanprop','Pokestar Brycen-Man-Prop'],
  'Pokestarmt': ['Pokestarmtprop','Pokestar MT-Prop'],
  'Pokestarmt2': ['Pokestarmt2prop','Pokestar MT2-Prop'],
  'Pokestartransport': ['Pokestartransportprop','Pokestar Transport-Prop'],
  'Pokestarhumanoid': ['Pokestarhumanoidprop','Pokestar Humanoid-Prop'],
  'Pokestarmonster': ['Pokestarmonsterprop','Pokestar Monster-Prop'],
  'Pokestarf00': ['Pokestarf00prop','Pokestar F-00-Prop'],
  'Pokestarf002': ['Pokestarf002prop','Pokestar F-002-Prop'],
  'Pokestarspirit': ['Pokestarspiritprop','Pokestar Spirit-Prop'],
  'Pokestarblackdoor': ['Pokestarblackdoorprop','Pokestar Black Door-Prop'],
  'Pokestarwhitedoor': ['Pokestarwhitedoorprop','Pokestar White Door-Prop'],
  'Pokestarblackbelt': ['Pokestarblackbeltprop','Pokestar Black Belt-Prop'],
  "Farfetch'd": ['Farfetch\u2019d'],
  "Sirfetch'd": ['Sirfetch\u2019d'],
  "Farfetch'd-Galar": ['Farfetch\u2019d-Galar'],
  'Zarude': ['Zarudedada','Zarude-Dada'],
  'Palafin': ['Palafinhero','Palafin-Hero'],
  'Tatsugiri': ['Tatsugiricurly','Tatsugiri-Curly','Tatsugiridroopy','Tatsugiri-Droopy','Tatsugiristretchy','Tatsugiri-Stretchy'],
  'Tatsugiri-Curly-Mega': ['Tatsugiricurlymega','Tatsugiri-Curly-Mega','Tatsugiridroopymega','Tatsugiri-Droopy-Mega','Tatsugiristretchymega','Tatsugiri-Stretchy-Mega'],
  'Dudunsparce': ['Dudunsparcethreesegment','Dudunsparce-Three-Segment'],
  'Maushold': ['Mausholdfour','Maushold-Four'],
  'Squawkabilly': ['Squawkabillyblue','Squawkabilly-Blue','Squawkabillyyellow','Squawkabilly-Yellow','Squawkabillywhite','Squawkabilly-White'],
  'Tauros-Paldea-Combat': ['Tauros-Paldea','Taurospaldea'],
  'Tauros-Paldea-Blaze': ['Tauros-Paldea-Fire','Taurospaldeafire'],
  'Tauros-Paldea-Aqua': ['Tauros-Paldea-Water','Taurospaldeawater'],
  'Greninja': ['Greninja-Ash','Greninjaash','Greninja-Bond','Greninjabond'],
  'Sinistcha': ['Sinistcha-Masterpiece','Sinistchamasterpiece'],
  'Poltchageist': ['Poltchageist-Artisan','Poltchageistartisan'],
  'Ogerpon': ['Ogerpon-Teal-Tera','Ogerpontealtera'],
  'Ogerpon-Cornerstone': ['Ogerpon-Cornerstone-Tera','Ogerponcornerstonetera'],
  'Ogerpon-Hearthflame': ['Ogerpon-Hearthflame-Tera','Ogerponhearthflametera'],
  'Ogerpon-Wellspring': ['Ogerpon-Wellspring-Tera','Ogerponwellspringtera'],
  'Terapagos': ['Terapagos-Terastal','Terapagosterastal','Terapagos-Stellar','Terapagosstellar'],
  'Ramnarok': ['Ramnarok-Radiant','Ramnarokradiant'],
};

export const reverseAliases: Record<string, string> = Object.fromEntries(
  Object.entries(aliases).flatMap(([species, aliasList]) =>
    aliasList.map((alias) => [alias, species])
  )
);

export const nonSinglesFormats: Set<string> = new Set([
  'gen9randomdoublesbattle',
  'gen9doublesou',
  'gen9doublesubers',
  'gen9doublesuu',
  'gen9vgc2026regi',
  'gen9vgc2026regf',
  'gen9vgc2026regfbo3',
  'gen92v2doubles',
  'gen94v4doublesuu',
  'gen4vgc2009',
  'gen9nationaldexdoubles',
  'gen8nationaldexdoubles',
  'gen9challengecup2v2',
  'gen9metronomebattle',
  'gen8doublesou',
  'gen7doublesou',
  'gen6doublesou',
  'gen9vgc2026regibo3',
  'gen9championsvgc2026regma',
  'gen9championsvgc2026regmabo3',
]);

export const non6v6Formats: Set<string> = new Set([
  'gen9bssregi',
  'gen9vgc2026regi',
  'gen9vgc2026regf',
  'gen9vgc2026regfbo3',
  'gen91v1',
  'gen92v2doubles',
  'gen94v4doublesuu',
  'gen4vgc2009',
  'gen9challengecup1v1',
  'gen9challengecup2v2',
  'gen9vgc2026regibo3',
  'gen9championsbssregma',
  'gen9championsvgc2026regma',
  'gen9championsvgc2026regmabo3',
]);
