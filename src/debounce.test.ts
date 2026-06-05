import { afterEach, describe, expect, it, vi } from "vitest";

import debounce from "./utils/debounce";

describe("debounce", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("等待指定时间后才执行回调", () => {
        vi.useFakeTimers();
        const handler = vi.fn();
        const debounced = debounce(handler, 100);

        debounced("first");

        expect(handler).not.toHaveBeenCalled();

        vi.advanceTimersByTime(99);
        expect(handler).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith("first");
    });

    it("连续触发时只执行最后一次调用", () => {
        vi.useFakeTimers();
        const handler = vi.fn();
        const debounced = debounce(handler, 100);

        debounced("first");
        vi.advanceTimersByTime(50);
        debounced("second");
        vi.advanceTimersByTime(50);

        expect(handler).not.toHaveBeenCalled();

        vi.advanceTimersByTime(50);
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith("second");
    });

    it("执行回调时保留 this 上下文和参数", () => {
        vi.useFakeTimers();
        const context = {
            value: 41,
            handler(this: { value: number }, delta: number) {
                return this.value + delta;
            },
        };
        const spy = vi.fn(context.handler);
        const debounced = debounce(spy, 100);

        debounced.call(context, 1);
        vi.advanceTimersByTime(100);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.mock.contexts[0]).toBe(context);
        expect(spy).toHaveBeenCalledWith(1);
    });
});
