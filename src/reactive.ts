import {RAW, track, TrackOpTypes, trigger} from "./effect";
import {isArray} from "lodash";
import {arrayInstrumentations} from "./arrayinstructions";
import {isObject} from "./util"

export interface Target {
    [RAW]?: any;
}

let proxyMap: WeakMap<Object, any> = new WeakMap();

export function toRaw<T>(value: T) {
    return (value && (value as Target)[RAW]) || value;
}

/**
 * 处理普通对象
 */
const BaseHandler: ProxyHandler<any> = {
    /**
     * 访问某一属性时拦截
     * @param target 目标对象
     * @param prop 对象属性
     * @param receiver 代理对象本身
     */
    get(target, prop, receiver) {

        // 返回原始类型
        if (prop === RAW) {
            return target;
        }

        if (isArray(target)) {
            console.debug("[debug]访问数组", target, prop)
        }

        // 判断是否访问数组原型方法, 如果是则直接返回
        let fn;
        if (isArray(target) && (fn = arrayInstrumentations[prop])) {
            return fn;
        }

        // 获取访问的属性，并将this 指针绑定到proxy对象上
        const res = Reflect.get(target, prop, receiver)

        // 判断是否为对象，如果是对象则 lazy 创建, 避免为非对象创建（数组 constructor）
        if (isObject(res)) {
            return createReactiveObject(res);
        }

        // 只跟踪基础元素
        track(target, TrackOpTypes.GET, prop);

        return res;
    },
    set(target, prop, newValue, receiver) {

        if (isArray(target)) {
            console.debug("[debug]更新数组", target, prop, newValue)
        }

        // 执行effect
        let res = Reflect.set(target, prop, newValue, receiver)
        // 如果是修改数组元素
        trigger(target, prop);
        return res;
    }
}

export function createReactiveObject<T extends object>(target: T) {
    // reactive 只处理对象类型
    if (!isObject(target)) {
        return target;
    }

    // 已经构建好了则直接返回
    const existingProxy = proxyMap.get(target)
    if (existingProxy) {
        return existingProxy
    }

    return new Proxy(target, BaseHandler)
}