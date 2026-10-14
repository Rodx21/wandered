/**
 * Generates data/worldPaths.ts from world-atlas TopoJSON.
 *
 * Run once:
 *   npm install -D world-atlas topojson-client
 *   node scripts/generateWorldPaths.js
 */

const topojson = require('topojson-client');
const world    = require('world-atlas/countries-110m.json');
const fs       = require('fs');
const path     = require('path');

const W = 1000;
const H = 500;

// ISO 3166-1 numeric → alpha-2
const NUM_TO_A2 = {
  '004':'AF','008':'AL','012':'DZ','024':'AO','031':'AZ','032':'AR','036':'AU',
  '040':'AT','044':'BS','048':'BH','050':'BD','051':'AM','052':'BB','056':'BE',
  '064':'BT','068':'BO','070':'BA','072':'BW','076':'BR','084':'BZ','090':'SB',
  '096':'BN','100':'BG','104':'MM','108':'BI','112':'BY','116':'KH','120':'CM',
  '124':'CA','132':'CV','140':'CF','144':'LK','148':'TD','152':'CL','156':'CN',
  '170':'CO','174':'KM','178':'CG','180':'CD','188':'CR','191':'HR','192':'CU',
  '196':'CY','203':'CZ','204':'BJ','208':'DK','214':'DO','218':'EC','222':'SV',
  '226':'GQ','231':'ET','232':'ER','233':'EE','242':'FJ','246':'FI','250':'FR',
  '262':'DJ','266':'GA','268':'GE','276':'DE','288':'GH','296':'KI','300':'GR',
  '308':'GD','320':'GT','324':'GN','328':'GY','332':'HT','340':'HN','348':'HU',
  '352':'IS','356':'IN','360':'ID','364':'IR','368':'IQ','372':'IE','376':'IL',
  '380':'IT','384':'CI','388':'JM','392':'JP','398':'KZ','400':'JO','404':'KE',
  '408':'KP','410':'KR','414':'KW','417':'KG','418':'LA','422':'LB','426':'LS',
  '428':'LV','430':'LR','434':'LY','438':'LI','440':'LT','442':'LU','450':'MG',
  '454':'MW','458':'MY','462':'MV','466':'ML','470':'MT','478':'MR','480':'MU',
  '484':'MX','496':'MN','498':'MD','499':'ME','504':'MA','508':'MZ','512':'OM',
  '516':'NA','524':'NP','528':'NL','548':'VU','554':'NZ','558':'NI','562':'NE',
  '566':'NG','578':'NO','583':'FM','584':'MH','585':'PW','586':'PK','591':'PA',
  '598':'PG','600':'PY','604':'PE','608':'PH','616':'PL','620':'PT','624':'GW',
  '626':'TL','634':'QA','642':'RO','643':'RU','646':'RW','659':'KN','662':'LC',
  '670':'VC','678':'ST','682':'SA','686':'SN','688':'RS','690':'SC','694':'SL',
  '703':'SK','704':'VN','705':'SI','706':'SO','710':'ZA','716':'ZW','724':'ES',
  '728':'SS','729':'SD','740':'SR','748':'SZ','752':'SE','756':'CH','760':'SY',
  '762':'TJ','764':'TH','768':'TG','776':'TO','780':'TT','784':'AE','788':'TN',
  '792':'TR','795':'TM','800':'UG','804':'UA','807':'MK','818':'EG','826':'GB',
  '834':'TZ','840':'US','854':'BF','858':'UY','860':'UZ','862':'VE','882':'WS',
  '887':'YE','894':'ZM',
};

function project(lon, lat) {
  return [
    ((lon + 180) / 360) * W,
    ((90  - lat) / 180) * H,
  ];
}

function ringToD(ring) {
  return (
    ring
      .map(([lon, lat], i) => {
        const [x, y] = project(lon, lat);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join('') + 'Z'
  );
}

function geometryToD(geom) {
  if (!geom) return '';
  if (geom.type === 'Polygon')
    return geom.coordinates.map(ringToD).join('');
  if (geom.type === 'MultiPolygon')
    return geom.coordinates.flatMap((poly) => poly.map(ringToD)).join('');
  return '';
}

const countries = topojson.feature(world, world.objects.countries);

const paths = countries.features
  .map((f) => {
    const code = NUM_TO_A2[String(f.id).padStart(3, '0')];
    if (!code) return null;
    const d = geometryToD(f.geometry);
    if (!d) return null;
    return { code, d };
  })
  .filter(Boolean)
  .sort((a, b) => a.code.localeCompare(b.code));

const out = `// Auto-generated — do not edit manually.
// Re-run: node scripts/generateWorldPaths.js

export type WorldPath = { code: string; d: string };

export const WORLD_PATHS: WorldPath[] = ${JSON.stringify(paths, null, 2)};
`;

const dest = path.join(__dirname, '../data/worldPaths.ts');
fs.writeFileSync(dest, out, 'utf-8');
console.log(`✅  ${paths.length} countries → data/worldPaths.ts`);
