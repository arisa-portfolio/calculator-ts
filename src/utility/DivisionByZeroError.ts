/**
 * DivisionByZeroError 0で割った時に発生するエラー
 */
export class DivisionByZeroError extends Error {
    /**
     * 
     * @param message 0で割った時のエラーメッセージ
     */
    constructor(message: string = "0で割ることはできません") {
        super(message);
        this.name = "DivisionByZeroError";
    }
}