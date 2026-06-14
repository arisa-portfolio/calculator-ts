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
        const normal = this.normalize(value.toString());

        if (this.countDigits(normal) <= Config.MAX_SIGNIFICANT_DIGITS) {
            return normal;
        }

        console.debug("指数表記へ切替");

        return this.formatExponential(value);
    }

    /**
     * 数値を指数表記へ変換する
     * 
     * 有効数字 8桁以内になるよう変換する
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
     * 表示文字列を正規化する
     * - 末尾の不要な 0 を削除
     * - "." のみ残る場合は削除
     * 
     * ※ 指数表記は対象外
     * 
     * @param text 数値文字列
     * @returns 正規化後の文字列
     */
    private static normalize(text: string): string {
        // 指数表記はそのまま
        if (text.includes("e")) {
            return text;
        }

        if(!text.includes(".")) {
            return text;
        }

        return text
            .replace(/0+$/, "")
            .replace(/\.$/, "");
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

        console.debug("数字桁数確認", {
            text,
            count
        });

        return count;
    }
}