import { Config } from "../utility/Config";

/**
 * 数値を表示用文字列に変換するクラス
 */
export class NumberFormatter {
    /**
     * 数値を表示用文字列に変換する
     * 
     * 表示ルール：
     * - 有効数字が 8桁以内なら通常表示
     * - 超える場合は指数表記
     * 
     * @param value 表示対象の数値
     * @returns 表示用文字列
     */
    public static format(value: number): string {
        // -0 対策
        if (Object.is(value, -0)) {
            value = 0;
        }

        // 通常文字列
        const normal = this.toPlainString(value);

        console.debug("通常表示確認", {
            value,
            normal,
            digits: this.countDigits(normal),
        });

        if (this.countDigits(normal) <= Config.MAX_SIGNIFICANT_DIGITS) {
            return normal;
        }

        console.debug("指数表記へ切替");

        return this.formatExponential(value);
    }

    /**
     * 数値を表示用の通常表記文字列へ変換する
     * 
     * - 指数表記を使用しない
     * - 浮動小数点による不要な誤差表示を抑えるため 15桁で固定する
     * - 末尾の不要な 0を削除する
     * - 不要な小数点を削除する
     * 
     * @param value 変換対象の数値
     * @returns 通常表記の文字列
     */
    private static toPlainString(value: number): string {
        return value
            .toFixed(15)
            .replace(/0+$/, "")
            .replace(/\.$/, "");
    }

    /**
     * 数値を指数表記へ変換する
     * 
     * Config で設定した最大有効数字以内になるよう変換する
     * 
     * @param value 変換対象の数値
     * @returns 指数表記文字列
     */
    private static formatExponential(value: number): string {
        const fractionDigits = Config.MAX_SIGNIFICANT_DIGITS - 1;

        const text = value.toExponential(fractionDigits);

        /** e の直前にある不要な 0を削除 */
        const normalized = text
            .replace(/\.?0+(?=e)/, "")
            .replace(".e", "e");
        
        console.debug("指数表記変換", {
            value,
            text,
            normalized
        });

        return normalized;
    }

    /**
     * 数字部分の桁数を取得する
     * 
     * ".", "-", "e", "+" は除外する
     * 
     * @param text 表示文字列
     * @returns 数字の桁数
     */
    private static countDigits(text: string): number {
        const count = text.replace(/[.\-e+]/g, "").length;

        console.debug("桁数判定", {
            text,
            count,
            max: Config.MAX_SIGNIFICANT_DIGITS
        });

        return count;
    }
}