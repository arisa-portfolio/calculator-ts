import { Evaluator } from "../domain/Evaluator";
import { InputBuffer } from "../domain/InputBuffer";
import { NumberFormatter } from "../domain/NumberFormatter";
import { Operation } from "../domain/Operation";
import type { IDisplay } from "../ui/IDisplay";
import type { KeyToken } from "../ui/KeyToken";
import { Config } from "../utility/Config";
import { DivisionByZeroError } from "../utility/DivisionByZeroError";
import { CalcState } from "./CalcState";

/**
 * 電卓の状態管理・計算制御を行うクラス
 */
export class Calculator {
    /** 電卓の状態 */
    private state: CalcState = CalcState.Ready;

    /** 左辺の数値 */
    private leftSideNumber: number | null = null;
    
    /** 現在の演算子 */
    private currentOperator: Operation | null = null;

    /** 入力中の文字列 */
    private readonly buffer = new InputBuffer();

    // 起動時に「0」表示
    constructor(private readonly display: IDisplay) {}

    /**
     * キー入力を受けて各処理へ振り分け
     * @param token ボタンの種類
     */
    public handle(token: KeyToken): void {
        switch (token.kind) {
            case "digit":
                this.handleDigit(token.value);
                break;
            
            case "decimal":
                this.handleDecimalPoint();
                break;

            case "operation":
                this.handleOperator(token.value);
                break;

            case "equal":
                this.handleEqual();
                break;

            case "allClear":
                this.handleAllClear();
                break;

            case "backspace":
                this.handleBackspace();
                break;
        }
    }

    /**
     * 数字入力を処理する
     * 必要に応じて状態遷移を行う
     * @param digit 入力した数字
     */
    private handleDigit(digit: number): void {
        // エラー後自動復帰・結果表示後ならクリアする
        if (
            this.state === CalcState.Error ||
            this.state === CalcState.ResultShown
        ) {
            this.handleAllClear();
        }

        // Operator後の最初の入力ならクリア
        if (this.state === CalcState.OperatorEntered) {
            this.state = CalcState.InputtingSecond;
        }

        // 初期状態なら、最初の数字入力中になる
        if (this.state === CalcState.Ready) {
            this.state = CalcState.InputtingFirst;
        }

        this.buffer.pushDigit(digit);

        this.render();
        this.renderHistory();
    }

    /**
     * 小数点の入力を処理する
     * 必要に応じて状態遷移を行う
     */
    private handleDecimalPoint(): void {
        // エラー後自動復帰・結果表示後ならクリアする
        if (
            this.state === CalcState.Error ||
            this.state === CalcState.ResultShown) {
            this.handleAllClear();
        }

        // Operator後の最初の入力ならクリア
        if (this.state === CalcState.OperatorEntered) {
            this.buffer.clear();
            this.state = CalcState.InputtingSecond;
        }
        
        // 初期状態なら、最初の数字入力中になる
        if (this.state === CalcState.Ready) {
            this.state = CalcState.InputtingFirst;
        }
        
        this.buffer.pushDecimal();

        this.render();
        this.renderHistory();
    }

    /**
     * 演算子入力を処理する
     * 
     * 処理の流れ：
     * 1. マイナス記号かどうか判定（符号処理）
     * 2. 演算子の上書き処理
     * 3. 必要なら計算を実行（左から順）
     * 4. 次の計算の準備を行う
     * 
     * @param operation 入力された演算子
     */
    private handleOperator(operation: Operation): void {
        // ① 符号
        if (this.tryHandleSign(operation)) {
            this.render();
            this.renderHistory();
            return;
        }

        // ② 上書き
        if (this.tryOverwriteOperator(operation)) {
            this.renderHistory();
            return;
        }

        // ③ 計算
        this.computeIfNeeded();

        // ④ 次の準備
        this.prepareNextOperation(operation);

        this.render();
        this.renderHistory();
    }

    /**
     * マイナス記号を「符号」として扱うか判定する
     * 
     * 仕様：
     * - 先頭の "-" → 負数入力
     * - 演算子直後の "-" → 右辺の負数
     * - すでに "-" が入力済みの場合は無視する
     * 
     * @param operation 入力された演算子
     * @returns 符号として処理した場合 true
     */
    private tryHandleSign(operation: Operation): boolean {
        // "-" 以外は対象外
        if (operation !== Operation.Subtract) {
            return false;
        }

        // すでに "-" の場合は何もしない
        if (this.buffer.isOnlyMinus()) {
            console.debug("マイナス重複入力を無視");
            return true;
        }

        // ① 先頭の "-"
        if (
            this.leftSideNumber === null &&
            this.buffer.isEmpty()
        ) {
            console.debug("符号入力（先頭）");

            this.buffer.pushMinus();
            this.state = CalcState.InputtingFirst;
            return true;
        }

        // ② 演算子直後の "-"
        if (
            this.state === CalcState.OperatorEntered &&
            this.buffer.isEmpty()
        ) {
            console.debug("符号入力（右辺）");

            this.buffer.pushMinus();
            this.state = CalcState.InputtingSecond;
            return true;
        }

        return false;
    }

    /**
     * 演算子の上書き処理
     * 
     * - 演算子入力直後に別の演算子が押された場合、
     *   現在の演算子を新しいものに置き換える
     * 
     * @param operation 入力された演算子
     * @returns 上書きした場合 true
     */
    private tryOverwriteOperator(operation: Operation): boolean {
        if (this.state === CalcState.OperatorEntered) {
            console.debug("演算子上書き", {
                from: this.currentOperator,
                to: operation
            });

            this.currentOperator = operation;
            return true;
        }

        return false;
    }

    /**
     * 連続計算を行う
     * 
     * left / operator / buffer が揃っている場合のみ計算を実行する。
     * 計算結果は次の計算のために left に保持する。
    */
   private computeIfNeeded(): void {
       if (
           this.leftSideNumber !== null &&
           this.currentOperator !== null &&
           !this.buffer.isEmpty() &&
           !this.buffer.isOnlyMinus()
        ) {
            const right = this.buffer.toNumber();
            
            console.debug("連続計算", {
                left: this.leftSideNumber,
                operator: this.currentOperator,
                right
            });

            try {
                const result = Evaluator.compute(
                    this.leftSideNumber,
                    this.currentOperator,
                    right
                );

                // 計算結果を左辺に代入する
                this.leftSideNumber = result;

            } catch (error) {
                this.handleError(error);
                throw error;
            }
        } else {
            // 初回
            if (!this.buffer.isEmpty() && !this.buffer.isOnlyMinus()) {
                this.leftSideNumber = this.buffer.toNumber();
            }
        }
    }

    /**
     * 次の計算に向けた状態を準備する
     * 
     * - 演算子を保持
     * - 入力バッファをクリア
     * - 中間結果を表示用にバッファへ設定
     * - 状態を OperatorEntered に遷移
     * 
     * @param operation 入力された演算子
     */
    private prepareNextOperation(operation: Operation): void {
        this.currentOperator = operation;

        this.buffer.clear();

        // 状態更新
        this.state = CalcState.OperatorEntered;
    }

    /**
     * 現在の式を計算し、結果を表示する
     */
    private handleEqual(): void {
        // 入力している数値や演算子がない場合、何もしない
        if (this.leftSideNumber === null || this.currentOperator === null) {
            return;
        }
        
        // 右辺が空、または "-" のみの場合も計算しない
        if (this.buffer.isEmpty() || this.buffer.isOnlyMinus()) {
            return;
        }

        const right = this.buffer.toNumber();

        console.debug("計算実行", {
                left: this.leftSideNumber,
                operator: this.currentOperator,
                right
            });

        try {
            const result = Evaluator.compute(
                this.leftSideNumber,
                this.currentOperator,
                right
            );
    
            // 計算結果を表示
            this.buffer.setValue(result.toString());

            this.display.renderHistory(
                `${this.leftSideNumber} ${this.getOperatorSymbol(this.currentOperator)} ${right} =`
            );
    
            console.debug("状態遷移", {
                from: this.state,
                to: CalcState.ResultShown
            });

            // 状態更新
            this.state = CalcState.ResultShown;

            this.leftSideNumber = null;
            this.currentOperator = null;

            this.render();

        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * 電卓全体を初期状態に戻す
     */
    private handleAllClear(): void {
        this.buffer.clear();
        this.leftSideNumber = null;
        this.currentOperator = null;
        this.state = CalcState.Ready;

        this.display.renderHistory("");
        this.render();
    }

    /**
     * 入力中の末尾1文字を削除する
     */
    private handleBackspace(): void {
        if (this.state === CalcState.Error) {
            return;
        }

        this.buffer.backspace();

        if (this.buffer.isEmpty()) {
            this.state = CalcState.Ready;
            this.leftSideNumber = null;
            this.currentOperator = null;
        }

        this.render();
    }

    /**
     * エラー処理を行う
     * - 0除算の場合：Error状態に遷移し、エラーメッセージを表示
     * - それ以外のエラー：呼び出し元へ再スローする
     * 
     * @param error 発生した例外
     */
    private handleError(error: unknown): void {
        if (error instanceof DivisionByZeroError) {
            console.error(error.message);

            this.state = CalcState.Error;
            this.display.renderError(Config.ERROR_MESSAGE);
            return;
        }

        throw error;
    }

    /**
     * 現在の入力内容を表示する
     */
    private render(): void {
        // Operator 直後は left を表示
        if (
            this.state === CalcState.OperatorEntered &&
            this.leftSideNumber !== null
        ) {
            this.display.render(
                NumberFormatter.format(this.leftSideNumber)
            );
            return;
        }

        const inputText = this.buffer.getValue();

        const special = this.formatSpecial(inputText);

        if (special !== null) {
            this.display.render(special);
            return;
        }

        this.display.render(NumberFormatter.format(this.buffer.toNumber()));
    }

    /**
     * 入力途中の特殊な状態を表示用文字列へ変換する
     * 
     * 数値変換すると情報が失われる入力状態を補正する。
     * 
     * 対象：
     * - 空文字 → "0"
     * - "-" → "-"
     * - "." → "0."
     * - "-." → "-0."
     * - "0.0" → "0.0"
     * - 末尾 "." の入力→ そのまま表示
     * 
     * @param inputText 入力バッファが保持している未変換の文字列
     * @returns 表示用文字列。対象外の場合は null
     */
    private formatSpecial(inputText: string): string | null {
        // 未入力の場合は初期表示
        if (inputText === "") {
            return "0";
        }

        // マイナス入力途中
        if (inputText === "-") {
            return "-";
        }

        // 小数点入力途中
        if (inputText === ".") {
            return "0.";
        }

        // 負の小数入力途中
        if (inputText === "-.") {
            return "-0.";
        }

        // 小数入力中の末尾 0を保持する
        if (
            inputText.includes(".") &&
            inputText.endsWith("0")
        ) {
            return inputText;
        }

        // 小数点入力後の状態を維持する
        if (inputText.endsWith(".")) {
            return inputText;
        }

        return null;
    }

    /**
     * 計算履歴を表示する
     * 
     * 状態に応じて以下を表示：
     * - 左辺のみ
     * - 左辺 + 演算子
     * - 左辺 + 演算子 + 右辺
     * 
     * UI の補助表示専用
     */
    private renderHistory(): void {
        // left なし → 何も表示しない
        if (this.leftSideNumber === null) {
            this.display.renderHistory("");
            return;
        }

        const op = this.currentOperator
            ? this.getOperatorSymbol(this.currentOperator)
            : "";

        const rightText = this.buffer.getValue();

        // 右辺がある場合
        if (rightText !== "" && this.state === CalcState.InputtingSecond) {
            this.display.renderHistory(`${this.leftSideNumber} ${op} ${rightText}`);
            return;
        }

        // 演算子のみ
        if (this.currentOperator !== null) {
            this.display.renderHistory(`${this.leftSideNumber} ${op}`);
            return;
        }

        this.display.renderHistory("");
    }

    /**
     * 演算子 → 記号変換
     */
    private getOperatorSymbol(operation: Operation): string {
        switch (operation) {
            case Operation.Add:
                return "+";

            case Operation.Subtract:
                return "-";

            case Operation.Multiply:
                return "×";

            case Operation.Divide:
                return "÷";
        }
    }
}