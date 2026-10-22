// Presentation scale only. Saved/projected workout volumes remain unchanged.
export const volumeChartScale = (values: readonly number[]) => {
  const max = values.reduce(
    (highest, value) =>
      Number.isFinite(value) ? Math.max(highest, value) : highest,
    0,
  );
  const lowerBound = max > 0 ? Math.max(max, Number.MIN_VALUE * 4) : 1;
  const power = 10 ** Math.floor(Math.log10(lowerBound));
  const multiplier =
    [1, 2, 5, 10].find((step) => step >= lowerBound / power) ?? 10;
  const candidate = multiplier * power;
  const upper =
    Number.isFinite(candidate) && candidate >= lowerBound
      ? candidate
      : lowerBound;
  return { upper, ticks: [upper, upper * 0.75, upper * 0.5, upper * 0.25, 0] };
};

export const volumeChartTick = (value: number, locale?: string) => {
  if (value === 0) return '0';
  if (value >= 1e6 || value < 0.001) {
    const [mantissa, exponent] = value.toExponential(2).split('e');
    return `${Number(mantissa).toLocaleString(locale, { maximumFractionDigits: 2, useGrouping: false })}e${exponent}`;
  }
  return Number(value.toPrecision(12)).toLocaleString(locale, {
    maximumFractionDigits: 12,
  });
};
