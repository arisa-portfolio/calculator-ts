/**
 * 電卓の状態管理を定義
 */
export const CalcState = {
    /** 初期状態 */
    Ready: "READY",

    /** 最初の数字入力中 */
    InputtingFirst: "INPUTTING_FIRST",

    /** 演算子入力済み */
    OperatorEntered: "OPERATOR_ENTERED",

    /** 2番目の数字入力中 */
    InputtingSecond: "INPUTTING_SECOND",

    /** 表示された計算結果 */
    ResultShown: "RESULT_SHOWN",

    /** 電卓UIのエラー状態 */
    Error: "ERROR",
} as const;

export type CalcState = typeof CalcState[keyof typeof CalcState];