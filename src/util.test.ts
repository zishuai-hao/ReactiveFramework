import { describe, expect, it } from "vitest";

import { hasChanged } from "./utils/util";

describe("util", () => {
    it("正确判断普通值变化", () => {
        expect(hasChanged(1, 2)).toBe(true);
        expect(hasChanged(1, 1)).toBe(false);
    });

    it("正确处理 NaN", () => {
        expect(hasChanged(Number.NaN, Number.NaN)).toBe(false);
        expect(hasChanged(Number.NaN, 1)).toBe(true);
    });

    it("正确区分 +0 和 -0", () => {
        expect(hasChanged(0, -0)).toBe(true);
        expect(hasChanged(-0, 0)).toBe(true);
    });
});
