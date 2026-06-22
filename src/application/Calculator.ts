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

    /**
     * 表示制御用インスタンスを受け取る
     * 
     * @param display 表示更新を担当するオブジェクト
     */
    constructor(private readonly display: IDisplay) {}

    /**
     * 入力されたキー情報を種類ごとの処理へ振り分ける
     * 
     * @param token 入力されたキー情報
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
     * 
     * 状態に応じて以下を行う
     * - エラー・結果表示後は初期化
     * - 演算子入力後は右辺入力状態へ遷移
     * - 入力バッファへ数字を追加
     * - 表示・履歴を更新
     * 
     * @param digit 入力する数字
     */
    private handleDigit(digit: number): void {
        // エラー後自動復帰・結果表示後ならクリアする
        if (
            this.state === CalcState.Error ||
            this.state === CalcState.ResultShown
        ) {
            this.handleAllClear();
        }

        // 演算子入力後の場合は右辺入力状態へ遷移
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
     * 
     * 状態に応じて初期化や右辺入力状態への遷移を行い、入力バッファへ小数点を追加する
     */
    private handleDecimalPoint(): void {
        // エラー中は入力を無視する
        if (this.state === CalcState.Error) {
            console.debug("エラー中の小数点入力を無視");
            return;
        }

        // 結果表示後はクリアして再入力
        if (this.state === CalcState.ResultShown) {
            this.handleAllClear();
        }

        // 演算子入力後の場合は右辺入力開始
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
     * 1. 演算子入力直後の場合は上書きを行う
     * 2. "-" の場合は符号入力か判定する
     * 3. 必要に応じて中間計算を行う
     * 4. 次の計算状態へ遷移する
     * 
     * @param operation 入力された演算子
     */
    private handleOperator(operation: Operation): void {
        // 演算子入力直後なら上書き優先
        if (
            this.state === CalcState.OperatorEntered &&
            operation !== Operation.Subtract
        ) {
            if (this.tryOverwriteOperator(operation)) {
                this.renderHistory();
                return;
            }
        }

        // "-" の場合のみ符号判定
        if (this.tryHandleSign(operation)) {
            this.render();
            this.renderHistory();
            return;
        }

        // "-" 以外、または符号ではない場合の上書き
        if (this.tryOverwriteOperator(operation)) {
            this.renderHistory();
            return;
        }

        // 計算
        this.computeIfNeeded();

        // 次の準備
        this.prepareNextOperation(operation);

        this.render();
        this.renderHistory();
    }

    /**
     * マイナス記号を符号入力として扱うか判定する
     * 
     * 仕様：
     * - 先頭の "-" のみ負数入力として扱う
     * - 演算子入力後の "-" は上書き処理へ渡す
     * - "-" 重複入力は無視する
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

        // ① 先頭の "-" のみ符号扱い
        if (
            this.leftSideNumber === null &&
            this.buffer.isEmpty()
        ) {
            console.debug("符号入力（先頭）");

            this.buffer.pushMinus();
            this.state = CalcState.InputtingFirst;
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
     * 必要に応じて中間計算を実行する
     * 
     * - 左辺・演算子・右辺が存在する場合は連続計算を行う
     * - 初回演算子入力時は入力値を左辺として保持する
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
     * 現在の入力内容を計算し、結果を表示する
     * 
     * 計算成功時：
     * - 計算結果を表示
     * - ResultShown状態へ遷移
     * - 次回入力に備えて演算情報をクリアする
     * 
     * 計算不可の場合：
     * - 入力不足の場合は何もしない
     * - 0除算の場合はエラー状態へ遷移
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
            this.buffer.setValue(NumberFormatter.format(result));

            this.display.renderHistory(
                `${NumberFormatter.format(this.leftSideNumber)} ${this.getOperatorSymbol(this.currentOperator)} ${NumberFormatter.format(right)} =`
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
     * バックスペース入力を処理する
     * 
     * 状態によって処理を変更する
     * 
     * - 数字入力中：末尾 1文字を削除
     * - 演算子入力後：演算子を取り消して左辺入力へ戻す
     * - 右辺入力中：右辺入力を削除して演算子待ちへ戻す
     * - 結果表示後：結果をクリアして初期状態へ戻す
     */
    private handleBackspace(): void {
        // エラー中は無視
        if (this.state === CalcState.Error) {
            return;
        }

        switch (this.state) {
            // 3 → ⌫
            case CalcState.InputtingFirst:

                this.buffer.backspace();

                if (this.buffer.isEmpty()) {
                    this.state = CalcState.Ready;
                }

                break;

            // 3+ → ⌫
            case CalcState.OperatorEntered:

                this.buffer.setValue(
                    NumberFormatter.format(this.leftSideNumber ?? 0)
                );

                this.leftSideNumber = null;
                this.currentOperator = null;

                this.state = CalcState.InputtingFirst;

                this.display.renderHistory("");

                break;

            // 3+2 → ⌫
            case CalcState.InputtingSecond:

                this.buffer.clear();

                this.state = CalcState.OperatorEntered;

                break;

            // 3+2= → ⌫
            case CalcState.ResultShown:

                this.buffer.clear();

                this.leftSideNumber = null;
                this.currentOperator = null;
                
                this.state = CalcState.Ready;

                this.display.renderHistory("");

                break;

            case CalcState.Ready:
                return;
        }

        this.render();

        // 常に最新状態で履歴更新
        this.renderHistory();
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
     * 現在状態に応じた表示内容を画面へ反映する
     * 
     * 入力途中の特殊状態（"-" や "0." など）は数値変換せず、そのまま表示する
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
     * 数値変換すると失われる入力途中の表現を保持する。
     * 
     * 対象：
     * - 空文字
     * - "-"
     * - 小数点入力途中
     * - 小数末尾の 0
     * - 小数入力中の値
     * 
     * @param inputText 入力バッファの文字列
     * @returns 表示用文字列。対象外の場合は null
     */
    private formatSpecial(inputText: string): string | null {
        // 未入力の場合は初期表示
        if (inputText === "") {
            return "0";
        }

        // マイナスだけ
        if (inputText === "-") {
            return "-";
        }

        // 小数点だけ
        if (inputText === ".") {
            return "0.";
        }

        // 負の小数入力途中
        if (inputText === "-.") {
            return "-0.";
        }

        // 小数入力中はそのまま表示
        if (inputText.includes(".")) {
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

        const leftText = NumberFormatter.format(this.leftSideNumber);

        const op = this.currentOperator
            ? this.getOperatorSymbol(this.currentOperator)
            : "";

        const rightText = this.buffer.getValue();

        // 右辺がある場合
        if (
            rightText !== "" &&
            this.state === CalcState.InputtingSecond
        ) {
            this.display.renderHistory(
                `${leftText} ${op} ${rightText}`
            );
            return;
        }

        // 演算子のみ
        if (this.currentOperator !== null) {
            this.display.renderHistory(
                `${leftText} ${op}`
            );
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