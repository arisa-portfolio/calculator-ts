import { DivisionByZeroError } from "../utility/DivisionByZeroError";
import { Operation } from "./Operation";

/**
 * 四則演算を行うクラス
 */
export class Evaluator {
    /**
     * 四則演算を行うメソッド
     * @param previousNumber 前の数値
     * @param operator 演算子
     * @param currentNumber 現在の数値
     * @returns 計算結果
     * @throws DivisionByZeroError 0で割った時に発生するエラー
     */
    public static compute(previousNumber: number, operator: Operation, currentNumber: number): number {
        switch (operator) {
            case Operation.Add:
                return previousNumber + currentNumber;

            case Operation.Subtract:
                return previousNumber - currentNumber;

            case Operation.Multiply:
                return previousNumber * currentNumber;

            case Operation.Divide:
                if (currentNumber === 0) {
                    throw new DivisionByZeroError();
                }
                
                return previousNumber / currentNumber;
        }
    }
}