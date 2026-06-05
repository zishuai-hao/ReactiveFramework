/**
 * 创建一个节流函数，确保回调在指定时间窗口内最多执行一次。
 *
 * @typeParam T - 需要被节流的函数类型。
 * @param func 需要执行的目标函数。
 * @param wait 节流等待时间，单位为毫秒。
 * @returns 返回包装后的节流函数。
 */
export default function throttle<T extends (...args: any[]) => any>(
    func: T,
    wait: number
) {
    // 是否处于限流状态
    let throttling = false;

    // 返回一个闭包
    return function (this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T> | void {
        // 确保当前不处于限流状态
        if (!throttling) {
            const result = func.apply(this, args);
            throttling = true;

            setTimeout(() => {
                throttling = false;
            }, wait);

            return result;
        }
    };
}
