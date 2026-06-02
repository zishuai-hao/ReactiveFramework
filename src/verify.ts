import {Ref} from "./ref";
import {effect} from "./effect";

// let user = {
//     "salary": 1000,
//     "bonus": 200,
//     "tax": 0.1
// }
//
// let userRef = new Ref(user);
//
// let total = new Ref(0);

// effect(() => {
//     total.value = userRef.value.bonus + userRef.value.salary;
//     console.log("total.value: " + total.value);
// })

// userRef.value = Object.assign({}, userRef.value, {bonus: 300});

let arr = [2, 3, 4, 5, 6];

let arrRef = new Ref(arr);

// 模拟一个聊天窗口自动滚动的场景
effect(() => {
    for (let number of arrRef.value) {
        console.log("输出当前消息", number);
    }
})

effect(() => {
    // 截断消息, 只保留最新的 4 条
    if (arrRef.value.length > 4) {
        arrRef.value = arrRef.value.splice(0, arrRef.value.length - 4);
    }
})

// arrRef.value = arrRef.value.concat([6, 7, 8]);
// arrRef.value.splice(0, 2, 666, 888);
