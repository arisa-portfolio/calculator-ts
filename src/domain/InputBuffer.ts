import { Config } from "../utility/Config";

/**
 * 電卓入力中の文字列を管理するクラス
 * 
 * 数値変換前の入力状態（小数点・負号など）を保持する
 */
export class InputBuffer {
    /** 入力中の文字列 */
    private inputValue: string = "";

    /**
     * 数字を入力文字列へ追加する
     * 
     * 以下を制御する
     * - 先頭 0の置換
     * - 最大入力桁数制限
     * 
     * @param digit 追加する数字（0〜9）
     */
    public pushDigit(digit: number): void {
        // 先頭 0制御
        if (this.inputValue === "0") {
            this.inputValue = digit.toString();
            return;
        }

        // 桁上限
        if (this.digitCount() >= Config.MAX_DIGITS) {
            console.debug("最大桁数に達しています", {
                value: this.inputValue,
                maxDigits: Config.MAX_DIGITS
            });
            return;
        }

        this.inputValue += digit.toString();
    }

    /**
     * 小数点を入力文字列へ追加する
     * 
     * 以下を制御する
     * - 小数点の重複入力防止
     * - 未入力時の "0." 補完
     */
    public pushDecimal(): void {
        // 重複防止
        if (this.inputValue.includes(".")) {
            console.debug("小数点はすでに存在します");
            return;
        }

        // 0.補完
        if (this.isEmpty()) {
            this.inputValue = "0.";
            return;
        }
        
        this.inputValue += ".";
    }

    /**
     * 入力値へマイナス符号を付与する
     * 
     * - 未入力の場合は "-" のみ保持
     * - 入力済みの場合は先頭へ "-" を追加
     * - すでに "-" がある場合は変更しない
     */
    public pushMinus(): void {
        // すでに "-" があるなら何もしない
        if (this.inputValue.startsWith("-")) {
            return;
        }

        // 空なら "-" のみ
        if (this.isEmpty()) {
            this.inputValue = "-";
            return;
        }

        // それ以外は符号付与
        this.inputValue = "-" + this.inputValue;
    }

    /**
     * 入力内容がマイナス記号だけか判定する
     * 
     * @returns "-" のみの場合 true
     */
    public isOnlyMinus(): boolean {
        return this.inputValue === "-";
    }

    /**
     * 値が空かどうかを判定する
     */
    public isEmpty(): boolean {
        return this.inputValue.length === 0;
    }

    /**
     * クリアにする
     */
    public clear(): void {
        this.inputValue = "";
    }

    /**
     * 入力文字列の末尾 1文字を削除する
     * 
     * 入力が空の場合は何もしない
     */
    public backspace(): void {
        if (this.isEmpty()) {
            return;
        }
        
        // 0文字目から 最後の1文字を除いたところまで
        this.inputValue = this.inputValue.slice(0, -1);
    }

    /**
     * 現在の入力文字列を取得する
     * 
     * @returns 入力中の文字列
    */
    public getValue(): string {
       return this.inputValue;
    }

    /**
     * 入力文字列を数値へ変換する
     * 
     * 空文字の場合は 0として扱う
     * 
     * @returns 数値化した入力値
     */
    public toNumber(): number {
        // 空文字の場合は 0 を返す
        if (this.isEmpty()) {
            return 0;
        }

        return Number(this.inputValue);
    }

    /**
     * 入力文字列内の数字のみの桁数を取得する
     * 
     * 小数点と負号は桁数に含めない
     * 
     * @returns 数字部分の桁数
     */
    public digitCount(): number {
        return this.inputValue.replace(/[.\-]/g, "").length;
    }

    /**
     * 入力文字列を直接設定する
     * 
     * 計算結果の表示復元など、通常入力以外の状態復帰で使用する
     * 
     * @param value 設定する文字列
     */
    public setValue(value: string): void {
        this.inputValue = value;
    }
}