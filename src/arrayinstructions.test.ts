import { describe, expect, it } from "vitest";

import { effect } from "./effect";
import { isProxy } from "./ref";
import { createReactiveObject } from "./reactive";

describe("arrayinstructions", () => {

    it("for...of 迭代时会保留数组元素的响应式能力", () => {
        const list = createReactiveObject([
            { count: 1 },
            { count: 2 },
        ]);
        let total = 0;

        effect(() => {
            total = 0;
            for (const item of list) {
                total += item.count;
            }
        });

        expect(total).toBe(3);

        list[1].count = 3;

        expect(total).toBe(4);
    });

    it("splice 修改数组内容后会重新触发基于迭代的 effect", () => {
        const list = createReactiveObject([
            { count: 1 },
            { count: 2 },
            { count: 3 },
        ]);
        let total = 0;

        effect(() => {
            total = 0;
            for (const item of list) {
                total += item.count;
            }
        });

        expect(total).toBe(6);

        list.splice(1, 2, { count: 4 });

        expect(total).toBe(5);
    });

    it("concat 返回普通数组并为结果中的对象元素保留响应式能力", () => {
        const list = createReactiveObject([{ count: 1 }]);
        const merged = list.concat([{ count: 2 }]);
        let total = 0;

        expect(isProxy(merged)).toBe(false);
        expect(isProxy(merged[0])).toBe(true);
        expect(isProxy(merged[1])).toBe(false);

        effect(() => {
            total = merged[0].count + merged[1].count;
        });

        expect(total).toBe(3);

        merged[0].count = 3;
        expect(total).toBe(5);

        merged[1].count = 4;
        expect(total).toBe(5);
    });
});
