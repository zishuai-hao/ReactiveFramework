import { afterEach, describe, expect, it, vi } from "vitest";

import throttle from "./utils/throttle";

describe("throttle", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("首次调用时立即执行，并在等待时间内忽略后续调用", () => {
        vi.useFakeTimers();
        const handler = vi.fn();
        const throttled = throttle(handler, 100);

        throttled("first");
        throttled("second");

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith("first");

        vi.advanceTimersByTime(100);
        throttled("third");

        expect(handler).toHaveBeenCalledTimes(2);
        expect(handler).toHaveBeenLastCalledWith("third");
    });

    it("调用时保留 this 上下文和参数", () => {
        vi.useFakeTimers();
        const context = {
            value: 41,
            handler(this: { value: number }, delta: number) {
                return this.value + delta;
            },
        };
        const spy = vi.fn(context.handler);
        const throttled = throttle(spy, 100);

        const result = throttled.call(context, 1);

        expect(result).toBe(42);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.mock.contexts[0]).toBe(context);
        expect(spy).toHaveBeenCalledWith(1);
    });
});
