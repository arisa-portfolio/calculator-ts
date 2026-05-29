/**
 * 演算子の名前を定義
 */
export const Operation = {
    /** 加算 */
    Add: "ADD",

    /** 減算 */
    Subtract: "SUBTRACT",

    /** 乗算 */
    Multiply: "MULTIPLY",
    
    /** 除算 */
    Divide: "DIVIDE",
} as const;

export type Operation = typeof Operation[keyof typeof Operation];