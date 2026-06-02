import {isArray} from "lodash";


export const RAW = Symbol('RAW');
export const ARRAY_ITERATE_KEY = Symbol('ARRAY_ITERATE_KEY');

const trackStack: boolean[] = [];
let trackIng = true

export function pauseTrack() {
    trackStack.push(true);
    trackIng = false;
}

export function resetTrack() {
    trackStack.pop()
    trackIng = true;
}


/**
 * 记录追踪操作的类型
 */
export enum TrackOpTypes {
    /**
     * 存在遍历数组操作时，会追踪该类型，触发时会重新遍历数组以获取最新的元素值
     */
    ITERATE = 'ITERATE',
    GET = 'GET',
}

/**
 * @deprecated 记录触发操作的类型, 当前版本未使用
 * SET 修改某个属性
 * ADD 添加某个属性
 * DEL 删除某个属性
 */
export enum TriggerOpTypes {
    SET = 'SET',
}

function track(target: object, type: TrackOpTypes, prop: string | symbol) {
    if (trackIng) {
        addEffect(target, prop);
    }
}

function trigger(target: object, prop: string | symbol) {
    executeEffect(target, prop);
}

export type Effect = Function;

const CacheDeps: WeakMap<Object, Map<string | symbol, Set<Effect>>> = new WeakMap();

// 记录当前活跃的effect 函数
let activeEffect: Effect | null = null;

function addEffect(target: object, prop: string | symbol) {
    // 如果没有活跃的副作用函数则返回
    if (!activeEffect) {
        return;
    }

    if (target === null || typeof target !== "object") {
        throw new Error();
    }
    // 将该effect添加到该属性的依赖集合中
    let depsMap = CacheDeps.get(target)
    if (!depsMap) {
        depsMap = new Map();
        CacheDeps.set(target, depsMap);
    }

    let dep = depsMap.get(prop);
    if (!dep) {
        dep = new Set();
        depsMap.set(prop, dep);
    }

    dep.add(activeEffect);
}

function executeEffect(target: object, prop: string | symbol) {
    // 如果数组长度变化，则应该派发迭代器的更新
    if (isArray(target) && prop === 'length') {
        console.log("[debug] 数组长度更新，连锁派发更新")
        CacheDeps.get(target)?.forEach((dep, key) => {
            if (key == "length"
                || key == ARRAY_ITERATE_KEY
            ) {
                dep.forEach((item: Effect) => {
                    item();
                })
            }
        })
    } else {
        let dep = CacheDeps.get(target)?.get(prop);
        if (dep) {
            dep.forEach((item: Effect) => {
                item();
            })
        }
    }
}

// 1. 定义配置项接口
interface EffectOptions {
    immediate?: boolean;
}

// 包装为副作用函数，立即执行以获取依赖关系（类似 watchEffect）。
function effect(fn: Effect, options?: EffectOptions) {
    const effectFn = () => {
        try {
            // 当前函数执行时，将活跃effect 设置为本函数, 注意源码中实现的是 effect 栈
            activeEffect = fn;
            return fn();
        } finally {
            activeEffect = null;
        }
    }
    effectFn(); // 默认立即执行一次，开始首次依赖收集
}

export {track, trigger, effect, addEffect, executeEffect};