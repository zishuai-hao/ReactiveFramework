import { describe, expect, it } from "vitest";

import { effect } from "./effect";
import { Ref } from "./ref";

describe("ref", () => {
    it("在 ref 值变化时重新执行 effect", () => {
        const count = new Ref(1);
        let observed = 0;

        effect(() => {
            observed = count.value;
        });

        expect(observed).toBe(1);

        count.value = 2;

        expect(observed).toBe(2);
    });

    it("支持对象值的响应式访问", () => {
        const user = new Ref({ salary: 1000, bonus: 200 });
        let total = 0;

        effect(() => {
            total = user.value.salary + user.value.bonus;
        });

        expect(total).toBe(1200);

        user.value.bonus = 300;

        expect(total).toBe(1300);
    });

    it("替换整个对象时会同步更新依赖结果", () => {
        const user = new Ref({ salary: 1000, bonus: 200 });
        let total = 0;

        effect(() => {
            total = user.value.salary + user.value.bonus;
        });

        expect(total).toBe(1200);

        user.value = {
            salary: 1500,
            bonus: 500,
        };

        expect(total).toBe(2000);
    });

    it("同一个 effect 可以同时依赖多个 ref", () => {
        const salary = new Ref(1000);
        const bonus = new Ref(200);
        let total = 0;

        effect(() => {
            total = salary.value + bonus.value;
        });

        expect(total).toBe(1200);

        salary.value = 1500;
        expect(total).toBe(1700);

        bonus.value = 400;
        expect(total).toBe(1900);
    });
});
