/**
 * 创建一个防抖函数，确保回调仅在停止触发一段时间后执行。
 *
 * @typeParam T - 需要被防抖的函数类型。
 * @param func 需要执行的目标函数。
 * @param wait 防抖等待时间，单位为毫秒。
 * @returns 返回包装后的防抖函数。
 */
export default function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
) {
    let timer: ReturnType<typeof setTimeout> | undefined;

    return function (this: ThisParameterType<T>, ...args: Parameters<T>): void {
        if (timer) {
            clearTimeout(timer);
        }

        timer = setTimeout(() => {
            func.apply(this, args);
        }, wait);
    };
}
