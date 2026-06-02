import {createReactiveObject, toRaw} from "./reactive";
import {isArray} from "lodash";
import {ARRAY_ITERATE_KEY, pauseTrack, resetTrack, track, TrackOpTypes, trigger} from "./effect";

/*
 * 数组代理跟对象代理存在不同之处，数组不仅仅通过修改特定索引（属性）的值来触发响应式更新，并且会根据其length属性变化来触发迭代器的更新
 * 1. 迭代访问
 * 2. 原地更新
 * 3. 返回新数组
 * 三种响应式都涉及到读取数组元素，所以都会 track ARRAY_ITERATE_KEY 属性（，设计了不同的包装方式：
 * >注：当数组长度发生变化（len）时，会触发ARRAY_ITERATE_KEY 进而重新遍历。
 * 1. 迭代访问会返回一个Lazy的包装器，只有执行 next 时才会将内部元素包装为 Reactive / raw
 * 2. 原地更新数组类的方法，可能会存在循环派发的问题，因此需要暂停 tracking， 触发索引上的元素更新（类似改变一个对象的属性值）
 * 3. 返回新数组类的方法，返回值预期就应该是一个非响应式的新数组，同时为了避免内部对象的响应性丢失，会将内部元素包裹reactive 后返回一个普通数组。
 */

function reactiveReadArray<T>(array: T[]): T[] {
    // 该方法只用于“需要返回新数组”的场景。
    // 返回值必须是普通数组，因此这里只负责在必要时保留已有响应式元素，不应把新数组本身再转成 proxy。
    const raw: T[] = toRaw(array);
    if (raw === array) {
        return raw;
    }
    track(raw, TrackOpTypes.ITERATE, ARRAY_ITERATE_KEY)
    // 否则将其转换为普通数组并保留响应式对象
    return raw.map(toWrapped);
}

function shallowReadArray<T>(array: T[]): T[] {
    // 将数组转换为原始数组，并追踪数组长度变化
    track((array = toRaw(array)), TrackOpTypes.ITERATE, ARRAY_ITERATE_KEY)
    return array;
}

function toWrapped(value: any) {
    return createReactiveObject(value);
}

export const arrayInstrumentations: Record<string | symbol, Function> = <any>{
    __proto__: null,

    /**
     * 返回一个迭代器，执行Next时才会将内部元素包装为 Reactive / raw
     */
    [Symbol.iterator]() {
        return iterator(this, Symbol.iterator, (item: any) => toWrapped(item))
    },

    /**
     * 返回一个原始数组，内部元素会被包装为reactive
     * @param args
     */
    concat(...args: unknown[]) {
        // 这里只读取当前响应式数组并生成一个新的普通数组结果。
        // 新数组参数保持其原始语义，不在这里强制做 proxy 包装。
        return reactiveReadArray(this).concat(
            ...args,
        )
    },

    splice(...args: unknown[]) {
        // splice 会在原地修改，然后返回删除的元素列表, 在执行过程中会读取 length, 会触发依赖收集 ，将splice effect
        // 加入到 get length 的依赖中，之后在 splice 执行过程中 length 发生变化时会触发 effect 执行，然后该effect 又触发 splice 形成死循环。
        //   解决方法就是停止 tracking 直到函数执行结束，splice 本质是对数组的写操作，写操作不执行 tracking 而是执行 trigger, 数组元素变更后，会自动触发length 变化，进而自动派发更新。
        // 2. 其次 执行原始数组的 splice 方法，但是依然使用 proxy 对象作为上下文，以便确保每个元素都能获取响应式更新
        // 3. TODO splice 阶段会存在多步操作，如果每发生一步操作就派发更新会产生多次 DOM 渲染，性能较差，因此需要记录所有操作完成后，一起派发更新，在同一个微任务队列完成。
        pauseTrack();
        const res = (toRaw(this) as any)['splice'].apply(this, args)
        resetTrack();
        return res
    }
}

export function iterator(self: unknown[], method: keyof Array<unknown>, wrapValue: (value: any) => unknown) {
    const arr = shallowReadArray(self)

    // 将 iter 类强制包含 _next 方法
    const iter = (arr[method] as any)() as IterableIterator<unknown> & {
        _next: IterableIterator<unknown>['next']
    }

    // 如果 self 是 raw 数组，则触发next方法时将值包装为 reactive;
    if (arr !== self) {
        // 缓存原始方法
        iter._next = iter.next
        // 自定义 Next 方法
        iter.next = () => {
            const result = iter._next()
            if (!result.done) {
                result.value = wrapValue(result.value)
            }
            return result
        }
    }

    // 否则直接返回reactive 数组
    return iter
}
