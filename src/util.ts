export function hasChanged(x: unknown, y: unknown): boolean {
    if (x === y) {
        return x === 0 && 1 / x !== 1 / (y as number)
    } else {
        return x === x || y === y
    }
}

export const isObject = (val: unknown): val is Record<any, any> =>
    val !== null && typeof val === 'object'