import {
  normalizeDecimalInput,
  normalizeInputDigits,
  formatNumber,
  formatDate,
  formatEntryNumber,
  formatLocaleTag,
} from '../i18n/format';
it('localizes exact entry display without rounding manual precision or reparsing drafts', () => {
  expect(formatEntryNumber('ru', '82.1255')).toBe('82,1255');
  expect(formatEntryNumber('de', '1000.25')).toBe('1000,25');
  expect(formatEntryNumber('fr', '12,')).toBe('12,');
  expect(formatEntryNumber('en', 'bad')).toBe('bad');
  for (const locale of [
    'en',
    'ru',
    'de',
    'fr',
    'uk',
    'es',
    'pt-BR',
    'it',
    'pl',
    'tr',
    'zh-Hans',
    'hi',
    'bn',
    'ar',
    'ja',
    'vi',
    'mr',
    'id',
    'ko',
  ] as const) {
    expect(formatEntryNumber(locale, '12.1234567890123456789')).toBe(
      locale === 'ar'
        ? '12٫1234567890123456789'
        : locale === 'en' ||
            locale === 'zh-Hans' ||
            locale === 'hi' ||
            locale === 'bn' ||
            locale === 'ja' ||
            locale === 'mr' ||
            locale === 'ko'
          ? '12.1234567890123456789'
          : '12,1234567890123456789',
    );
  }
});
it('normalizes one decimal separator without accepting grouping or ambiguous input', () => {
  expect(['12,50', '12.50', '1,234', ' 0 '].map(normalizeDecimalInput)).toEqual(
    ['12.50', '12.50', '1.234', '0'],
  );
  expect(
    ['1,234.5', '1 234', '1e3', 'Infinity', '12,', '-1', ''].map(
      normalizeDecimalInput,
      normalizeInputDigits,
    ),
  ).toEqual(Array(7).fill(null));
});
it('formats presentation with explicit locale without altering values or epochs', () => {
  expect(formatNumber('de', 12.5)).toBe('12,5');
  expect(formatNumber('ru', 12.5)).toBe('12,5');
  const epoch = Date.UTC(2026, 9, 22);
  expect(
    formatDate('de', epoch, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC',
    }),
  ).toBe('22.10.2026');
  expect(epoch).toBe(Date.UTC(2026, 9, 22));
});

it('preserves localized entry precision when the runtime lacks formatToParts', () => {
  const proto = Intl.NumberFormat.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'formatToParts')!;
  Object.defineProperty(proto, 'formatToParts', {
    ...descriptor,
    value: undefined,
  });
  try {
    jest.isolateModules(() => {
      const { formatEntryNumber } = jest.requireActual('../i18n/format');
      expect(formatEntryNumber('ru', '82.12550')).toBe('82,12550');
      expect(formatEntryNumber('uk', '010.0400')).toBe('010,0400');
      expect(formatEntryNumber('en', '82,12550')).toBe('82.12550');
    });
  } finally {
    Object.defineProperty(proto, 'formatToParts', descriptor);
  }
});

it('formats Chinese dates and numbers without changing stored entry precision', () => {
  expect(formatNumber('zh-Hans', 12.5)).toBe('12.5');
  expect(
    formatDate('zh-Hans', Date.UTC(2026, 10, 17), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }),
  ).toBe('2026年11月17日');
});

it('formats Hindi dates and Indian number grouping without changing entry precision', () => {
  expect(formatNumber('hi', 123456.75)).toBe('1,23,456.75');
  expect(
    formatDate('hi', Date.UTC(2026, 10, 17), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }),
  ).toBe('17 नवंबर 2026');
});

it('formats Bengali digits, grouping and calendar dates while retaining exact entry text', () => {
  expect(formatNumber('bn', 123456.75)).toBe('১,২৩,৪৫৬.৭৫');
  expect(normalizeDecimalInput('১২,৫০')).toBe('12.50');
  expect(normalizeInputDigits('১২,')).toBe('12,');
  expect(normalizeDecimalInput('১,২৩৪.৫')).toBeNull();
  expect(formatEntryNumber('bn', '12.1234567890123456789')).toBe(
    '12.1234567890123456789',
  );
  expect(formatEntryNumber('bn', '12,')).toBe('12,');
  expect(
    formatDate('bn', Date.UTC(2026, 10, 17), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }),
  ).toBe('১৭ নভেম্বর, ২০২৬');
});

it('accepts Arabic editable digits and decimals without grouping, ambiguity or precision loss', () => {
  expect(normalizeDecimalInput('١٢٫١٢٣٤٥٦٧٨٩٠١٢٣٤٥٦٧٨٩')).toBe(
    '12.1234567890123456789',
  );
  expect(normalizeDecimalInput('۱۲,۵۰')).toBe('12.50');
  expect(normalizeDecimalInput('١٬٢٣٤')).toBeNull();
  expect(normalizeDecimalInput('١٢٫')).toBeNull();
  expect(formatEntryNumber('ar', '12.1234567890123456789')).toBe(
    '12٫1234567890123456789',
  );
  expect(formatNumber('ar', 1234.5)).toBe('١٬٢٣٤٫٥');
  expect(formatEntryNumber('ar', '12٫')).toBe('12٫');
});

it('handles Japanese dates, grouping and fullwidth numeric keyboard drafts without rounding', () => {
  expect(formatNumber('ja', 1234.5)).toBe('1,234.5');
  expect(
    formatDate('ja', Date.UTC(2026, 10, 18), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }),
  ).toBe('2026年11月18日');
  expect(normalizeInputDigits('１２，')).toBe('12,');
  expect(normalizeInputDigits('１２．')).toBe('12.');
  expect(
    normalizeDecimalInput('１２．１２３４５６７８９０１２３４５６７８９'),
  ).toBe('12.1234567890123456789');
  expect(formatEntryNumber('ja', '００１２，５０')).toBe('0012.50');
  for (const invalid of [
    '１，２３４．５',
    '１２．',
    '－１',
    '１ｅ３',
    '１２・５',
  ])
    expect(normalizeDecimalInput(invalid)).toBeNull();
});

it('formats Vietnamese numbers and dates without rounding exact manual values', () => {
  expect(formatNumber('vi', 1234.5)).toBe('1.234,5');
  expect(
    formatDate('vi', Date.UTC(2026, 10, 18), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }),
  ).toBe('18 tháng 11, 2026');
  expect(formatEntryNumber('vi', '12.1234567890123456789')).toBe(
    '12,1234567890123456789',
  );
  expect(formatEntryNumber('vi', '12,')).toBe('12,');
  expect(normalizeDecimalInput('12,50')).toBe('12.50');
  expect(normalizeDecimalInput('1.234,5')).toBeNull();
});

it('formats Marathi digits, Indian grouping and dates while preserving exact editable precision', () => {
  expect(formatNumber('mr', 123456.75)).toBe('१,२३,४५६.७५');
  expect(
    formatDate('mr', Date.UTC(2026, 10, 18), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }),
  ).toBe('१८ नोव्हेंबर, २०२६');
  expect(normalizeInputDigits('१२,')).toBe('12,');
  expect(normalizeDecimalInput('१२.१२३४५६७८९०१२३४५६७८९')).toBe(
    '12.1234567890123456789',
  );
  expect(formatEntryNumber('mr', '१२,५०')).toBe('12.50');
  expect(formatEntryNumber('mr', '१२,')).toBe('१२,');
  expect(normalizeDecimalInput('१,२३४.५')).toBeNull();
});

it('formats Indonesian comma decimals and dates without rounding manual input or accepting grouping', () => {
  expect(formatNumber('id', 1234.5)).toBe('1.234,5');
  expect(
    formatDate('id', Date.UTC(2026, 10, 18), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }),
  ).toBe('18 November 2026');
  expect(formatEntryNumber('id', '12.1234567890123456789')).toBe(
    '12,1234567890123456789',
  );
  expect(formatEntryNumber('id', '12,')).toBe('12,');
  expect(normalizeDecimalInput('12,50')).toBe('12.50');
  expect(normalizeDecimalInput('1.234,5')).toBeNull();
});

it('formats Korean decimal points and dates without rounding raw manual values', () => {
  expect(formatNumber('ko', 1234.5)).toBe('1,234.5');
  expect(
    formatDate('ko', Date.UTC(2026, 10, 18), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }),
  ).toBe('2026년 11월 18일');
  expect(formatEntryNumber('ko', '12.1234567890123456789')).toBe(
    '12.1234567890123456789',
  );
  expect(formatEntryNumber('ko', '12,')).toBe('12,');
  expect(normalizeDecimalInput('12,50')).toBe('12.50');
  expect(formatEntryNumber('ko', '１２，５０')).toBe('12.50');
  expect(normalizeDecimalInput('1,234.5')).toBeNull();
});

it('uses Dutch decimal and date notation without rounding exact input', () => {
  expect(normalizeDecimalInput('62,5')).toBe('62.5');
  expect(normalizeDecimalInput('62.5')).toBe('62.5');
  expect(formatEntryNumber('nl', '62.5')).toBe('62,5');
  expect(formatNumber('nl', 1234.5)).toBe('1.234,5');
  expect(
    formatDate('nl', Date.UTC(2026, 10, 25), {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  ).toBe('25 november 2026');
});

it('formats Swedish dates and numbers without changing exact stored decimal input', () => {
  expect(normalizeDecimalInput('62,5')).toBe('62.5');
  expect(formatEntryNumber('sv', '62.5')).toBe('62,5');
  expect(formatNumber('sv', 1234.5).replace(/\s/g, ' ')).toBe('1 234,5');
  expect(
    formatDate('sv', Date.UTC(2026, 10, 25), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }),
  ).toBe('25 november 2026');
});

it('normalizes Thai keypad digits and keeps workout dates aligned with the Gregorian picker', () => {
  expect(normalizeDecimalInput('๖๒.๕')).toBe('62.5');
  expect(normalizeDecimalInput('62.5')).toBe('62.5');
  expect(normalizeDecimalInput('๖๒,๕๐๐๑')).toBe('62.5001');
  expect(normalizeInputDigits('๘')).toBe('8');
  expect(normalizeDecimalInput('๑,๒๓๔.๕')).toBeNull();
  expect(formatNumber('th', 1234.5)).toBe('1,234.5');
  const epoch = Date.UTC(2026, 10, 25);
  expect(
    formatDate('th', epoch, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }),
  ).toBe('25 พฤศจิกายน 2026');
});

it('accepts Urdu and ASCII keypad values with the same precision and presents Pakistani digits', () => {
  expect(normalizeDecimalInput('۶۲٫۵')).toBe(normalizeDecimalInput('62.5'));
  expect(normalizeDecimalInput('۶۲٫۵۰۰۱')).toBe('62.5001');
  expect(normalizeInputDigits('۸')).toBe(normalizeInputDigits('8'));
  expect(formatNumber('ur', 62.5)).toBe('۶۲٫۵');
  expect(formatEntryNumber('ur', '62.5001')).toBe('62٫5001');
});

it('accepts Telugu and ASCII weight and repetitions with the same stored precision', () => {
  expect(normalizeDecimalInput('౬౨.౫')).toBe(normalizeDecimalInput('62.5'));
  expect(normalizeDecimalInput('౬౨.౫౦౦౧')).toBe('62.5001');
  expect(normalizeInputDigits('౮')).toBe(normalizeInputDigits('8'));
  expect(formatNumber('te', 62.5)).toBe('౬౨.౫');
  expect(formatNumber('te', 1234567.5)).toBe('౧,౨౩౪,౫౬౭.౫');
  expect(formatEntryNumber('te', '62.5001')).toBe('62.5001');
  const epoch = Date.UTC(2026, 10, 26);
  expect(
    formatDate('te', epoch, {
      day: 'numeric',
      year: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }),
  ).toContain('నవంబర్');
});

it('accepts Tamil and ASCII weight and repetitions at the same precision and formats in ta-IN', () => {
  expect(normalizeDecimalInput('௬௨.௫')).toBe(normalizeDecimalInput('62.5'));
  expect(normalizeDecimalInput('௬௨.௫௦௦௧')).toBe('62.5001');
  expect(normalizeInputDigits('௮')).toBe(normalizeInputDigits('8'));
  expect(formatNumber('ta', 62.5)).toBe('௬௨.௫');
  expect(formatNumber('ta', 1234567.5)).toBe('௧௨,௩௪,௫௬௭.௫');
  expect(formatEntryNumber('ta', '62.5001')).toBe('62.5001');
  expect(
    formatDate('ta', Date.UTC(2026, 10, 26), {
      day: 'numeric',
      year: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }),
  ).toBe('௨௬ நவம்பர், ௨௦௨௬');
});

it('normalizes full-width Taiwanese weight and reps and uses the Taiwan Gregorian date', () => {
  expect(normalizeDecimalInput('６２．５')).toBe(normalizeDecimalInput('62.5'));
  expect(normalizeInputDigits('８')).toBe('8');
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  } as const;
  expect(formatDate('zh-Hant', Date.UTC(2026, 11, 31), options)).toBe(
    '2026年12月31日',
  );
  expect(formatDate('zh-Hant', Date.UTC(2027, 0, 1), options)).toBe(
    '2027年1月1日',
  );
});

it('formats Bokmål dates and exact weights and saves canonical decimal input', () => {
  expect(formatLocaleTag('nb')).toBe('nb-NO');
  expect(formatNumber('nb', 62.5)).toBe('62,5');
  expect(formatEntryNumber('nb', '62.501')).toBe('62,501');
  expect(normalizeDecimalInput('62,501')).toBe('62.501');
  expect(
    formatDate('nb', Date.UTC(2026, 10, 26), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }),
  ).toBe('26. november 2026');
});

it('formats Finnish dates and preserves exact decimal weights', () => {
  expect(formatLocaleTag('fi')).toBe('fi-FI');
  expect(formatNumber('fi', 62.5)).toBe('62,5');
  expect(formatEntryNumber('fi', '62.501')).toBe('62,501');
  expect(normalizeDecimalInput('62,501')).toBe('62.501');
  expect(
    formatDate('fi', Date.UTC(2026, 10, 26), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }),
  ).toBe('26. marraskuuta 2026');
});
