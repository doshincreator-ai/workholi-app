export type CountryCode = 'NZ' | 'AU';

export interface CountryConfig {
  code: CountryCode;
  name: string;
  flag: string;
  currency: string;
  minWage: number;
  taxAgency: string;       // 税務機関名
  taxNumberLabel: string;  // IRD番号 / TFN番号
  regions: string[];
}

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  NZ: {
    code: 'NZ',
    name: 'New Zealand',
    flag: '🇳🇿',
    currency: 'NZD',
    minWage: 23.95,
    taxAgency: 'IRD',
    taxNumberLabel: 'IRD番号',
    regions: [
      'Auckland', 'Wellington', 'Christchurch', 'Queenstown', 'Hamilton',
      'Tauranga', 'Rotorua', 'Dunedin', 'Nelson', 'Napier/Hastings',
      'Palmerston North', 'New Plymouth', 'Whangarei', 'Invercargill', 'その他',
    ],
  },
  AU: {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD',
    minWage: 24.95,
    taxAgency: 'ATO',
    taxNumberLabel: 'TFN番号',
    regions: [
      'Sydney/NSW', 'Melbourne/VIC', 'Brisbane/QLD', 'Perth/WA',
      'Adelaide/SA', 'Gold Coast/QLD', 'Cairns/QLD',
      'Darwin/NT', 'Canberra/ACT', 'Tasmania/TAS', 'その他',
    ],
  },
};

export const COUNTRY_LIST: CountryConfig[] = Object.values(COUNTRIES);
