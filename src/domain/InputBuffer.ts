import { Config } from "../utility/Config";

/**
 * 入力バッファ（文字列）を管理するクラス
 */
export class InputBuffer {
    /** 入力された数値を意味する文字列 */
    private inputValue: string = "";

    /**
     * 数字を追加する（先頭0制御・桁上限あり）
     * @param digit 追加する数字（0〜9）
     */
    public pushDigit(digit: number): void {
        // 先頭0制御
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
     * 小数点を追加する（重複防止・0.補完）
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
     * 先頭が "-" の場合、マイナス記号として扱う
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

    public isOnlyMinus(): boolean {
        return this.inputValue === "-";
    }

    /**
     * 値が空かどうかを判定する
     */
    public isEmpty(): boolean {
        // this.value === "" と同じ意味
        return this.inputValue.length === 0;
    }

    /**
     * クリアにする
     */
    public clear(): void {
        this.inputValue = "";
    }

    /**
     * 末尾の1文字を削除する
     */
    public backspace(): void {
        if (this.isEmpty()) {
            return;
        }
        
        // 0文字目から 最後の1文字を除いたところまで
        this.inputValue = this.inputValue.slice(0, -1);
    }

    /**
     * value を取得する
     * @returns 入力された文字列
    */
    public getValue(): string {
       return this.inputValue;
    }

    /**
     * 現在の値を数値に変換する
     */
    public toNumber(): number {
        // 空文字の場合は 0 を返す
        if (this.isEmpty()) {
            return 0;
        }

        return Number(this.inputValue);
    }

    /**
     * 数字の桁数を取得する（"." と "-" は除外）
     */
    public digitCount(): number {
        return this.inputValue.replace(/[.\-]/g, "").length;
    }

    /**
     * 値を直接設定する
     */
    public setValue(value: string): void {
        this.inputValue = value;
    }
}