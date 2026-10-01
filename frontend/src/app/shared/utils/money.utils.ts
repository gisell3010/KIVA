export type Money = string;

export function parseMoney(value: string): number {
  const cleaned = value
    .replace(/[^\d.,-]/g, '')
    .replace(',', '.');

  const num = Number(cleaned);

  if (isNaN(num)) {
    return 0;
  }

  return Math.round(num * 100);
}

export function formatMoney(
  value: Money | number
): string {
  const num = typeof value === 'string'
    ? parseMoney(value) / 100
    : value;

  return num.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });
}

export function formatMoneyWithDecimals(
  value: Money | number
): string {
  const num = typeof value === 'string'
    ? parseMoney(value) / 100
    : value;

  return num.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function addMoney(
  a: Money | number,
  b: Money | number
): number {
  const numA = typeof a === 'string'
    ? parseMoney(a)
    : a * 100;

  const numB = typeof b === 'string'
    ? parseMoney(b)
    : b * 100;

  return (numA + numB) / 100;
}

export function subtractMoney(
  a: Money | number,
  b: Money | number
): number {
  const numA = typeof a === 'string'
    ? parseMoney(a)
    : a * 100;

  const numB = typeof b === 'string'
    ? parseMoney(b)
    : b * 100;

  return (numA - numB) / 100;
}

export function divideMoney(
  value: Money | number,
  divisor: number
): number {
  const num = typeof value === 'string'
    ? parseMoney(value)
    : value * 100;

  return Math.round(num / divisor) / 100;
}

export function sumMoney(
  values: (Money | number)[]
): number {
  return values.reduce<number>(
    (sum, value) => addMoney(sum, value),
    0
  );
}

export function compareMoney(
  a: Money | number,
  b: Money | number
): number {
  const numA = typeof a === 'string'
    ? parseMoney(a)
    : a * 100;

  const numB = typeof b === 'string'
    ? parseMoney(b)
    : b * 100;

  return numA - numB;
}