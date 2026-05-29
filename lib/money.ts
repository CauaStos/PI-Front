const SCALE = 10_000;
const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** R$24,90 -> 249000 */
export function toMinor(reais: number): number {
    return Math.round(reais * SCALE);
}

/** 249000 -> R$ 24,90 */
export function format(minor: number): string {
    return BRL.format(minor / SCALE);
}

/**
 * Parse input strings like "24,90" | "24.90" | "24" -> 249000.
 * Returns NaN if unparseable.
 */
export function parseInput(raw: string): number {
    const normalised = raw.trim().replace(",", ".");
    const reais = parseFloat(normalised);
    if (!isFinite(reais)) return NaN;
    return Math.round(reais * SCALE);
}

export function multiply(minor: number, qty: number): number {
    return Math.round(minor * qty);
}

export function sum(minors: number[]): number {
    return minors.reduce((acc, v) => acc + v, 0);
}
