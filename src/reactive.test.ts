import { describe, expect, it } from "vitest";

import { effect } from "./effect";
import { createReactiveObject } from "./reactive";

describe("reactive", () => {
    it("支持普通对象属性的响应式更新", () => {
        const state = createReactiveObject({ count: 1 });
        let observed = 0;

        effect(() => {
            observed = state.count;
        });

        expect(observed).toBe(1);

        state.count = 2;

        expect(observed).toBe(2);
    });

    it("支持嵌套对象基础属性的响应式更新", () => {
        const state = createReactiveObject({
            profile: {
                name: "zs",
                age: 18,
            },
        });
        let observed = "";

        effect(() => {
            observed = `${state.profile.name}-${state.profile.age}`;
        });

        expect(observed).toBe("zs-18");

        state.profile.age = 19;

        expect(observed).toBe("zs-19");
    });

    it("同一个属性可以驱动多个 effect", () => {
        const state = createReactiveObject({ count: 1 });
        let doubled = 0;
        let labelled = "";

        effect(() => {
            doubled = state.count * 2;
        });

        effect(() => {
            labelled = `count:${state.count}`;
        });

        expect(doubled).toBe(2);
        expect(labelled).toBe("count:1");

        state.count = 3;

        expect(doubled).toBe(6);
        expect(labelled).toBe("count:3");
    });
});
