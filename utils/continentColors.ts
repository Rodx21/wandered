/**
 * Continent-based fill color expression for Mapbox GL.
 * Uses the `iso_3166_1` (alpha-2) property from the country-boundaries-v1 tileset.
 */

const COLORS = {
  NA: '#F4B8B8',   // North America — rose
  SA: '#F5DFA0',   // South America — gold
  EU: '#A8D0EC',   // Europe — sky blue
  AF: '#F0C07A',   // Africa — warm amber
  AS: '#B8DDB0',   // Asia — sage green
  OC: '#C8B4E8',   // Oceania — soft lavender
  DEFAULT: '#D0D8E0',
};

// ISO 3166-1 alpha-2 codes grouped by continent
const NA = [
  'US','CA','MX','GT','BZ','HN','SV','NI','CR','PA',
  'CU','JM','HT','DO','TT','BB','LC','VC','GD','AG','KN','DM','BS',
  'PR','VI','GP','MQ','TC','KY','BM','VG','CW','AW','SX','MF','GL',
  'PM','MS','AI','BL',
];

const SA = [
  'BR','AR','CL','CO','VE','PE','EC','BO','PY','UY','SR','GY','GF','FK',
];

const EU = [
  'GB','FR','DE','ES','IT','PT','NL','BE','LU','CH','AT','PL','CZ','SK',
  'HU','RO','BG','GR','HR','SI','BA','RS','ME','MK','AL','XK','UA','MD',
  'BY','LT','LV','EE','FI','SE','NO','DK','IS','IE','AD','MC','LI','SM',
  'VA','MT','CY','RU','GE','AM','AZ','TR','FO','GI','IM','JE','GG',
];

const AF = [
  'NG','ET','EG','CD','TZ','ZA','KE','SD','DZ','UG','GH','MZ','MG',
  'CM','CI','NE','AO','ML','BF','MW','ZM','SN','TD','SO','ZW','RW','GN',
  'SS','TN','BI','BJ','ER','LY','SL','TG','CF','MR','LR','NA','BW','LS',
  'GM','GA','GQ','MU','SZ','DJ','KM','CV','ST','SC','MA','RE','YT',
];

const AS = [
  'CN','IN','ID','PK','BD','JP','PH','VN','TH','MM','KR','IQ','AF',
  'SA','UZ','MY','YE','NP','SY','KZ','KH','JO','AE','TJ','KG','TM',
  'LK','IL','HK','TW','MN','LA','OM','KW','QA','BH','LB','SG','TL',
  'BT','MV','BN','PS','MO','IR','KP',
];

const OC = [
  'AU','PG','NZ','FJ','SB','VU','WS','KI','FM','TO','PW','MH','NR',
  'TV','CK','NU','GU','AS','MP','NC','PF','WF',
];

/**
 * Returns a Mapbox GL `match` expression that maps each country's ISO alpha-2
 * code to its continent color. Use as `fillColor` in a FillLayer style.
 */
export function buildContinentFillExpression(): unknown[] {
  return [
    'match', ['get', 'iso_3166_1'],
    NA, COLORS.NA,
    SA, COLORS.SA,
    EU, COLORS.EU,
    AF, COLORS.AF,
    AS, COLORS.AS,
    OC, COLORS.OC,
    COLORS.DEFAULT,
  ];
}
