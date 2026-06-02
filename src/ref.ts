import {RAW, track, TrackOpTypes, trigger} from "./effect";
import {createReactiveObject, toRaw} from "./reactive";
import {isObject} from "lodash";
import {hasChanged} from "./util";

export function isRef(obj: any) {
    return obj.value
}

export function isProxy(value: any) {
    // proxy 会拦截 RAW 访问，并返回原始对象，如果不是 proxy 对象无法拦截，!!value[RAW] 就是 false
    return value ? !!value[RAW] : false
}

export class Ref<T = any> {
    // 分别保存
    _value: T;
    _rawValue: T;

    constructor(public target: T) {
        this._value = isObject(target) ? createReactiveObject(target) : target;
        this._rawValue = toRaw(target);
    }

    get value() {
        track(this, TrackOpTypes.GET, "value");
        return this._value;
    }

    set value(newValue) {
        if (hasChanged(this._rawValue, newValue)) {
            this._value = isObject(newValue) ? createReactiveObject(newValue) : newValue;
            this._rawValue = isProxy(newValue) ? toRaw(newValue) : newValue;
            // 执行effect
            trigger(this, "value");
        }
    }
}