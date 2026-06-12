import { Config } from "../utility/Config";

/**
 * 数値を表示用文字列に変換するクラス
 */
export class NumberFormatter {
    /**
     * 数値を表示用文字列に変換する
     * 
     * 表示ルール：
     * - 桁数内なら通常表示
     * - 超えたら指数表記
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
        const normal = value.toString();

        // 正規化
        const normalized = this.normalize(normal);

        if (this.isFits(normalized)) {
            return normalized;
        }

        console.debug("指数表記へ切替");

        return this.formatExponential(value);
    }

    /**
     * 数値を指数表記へ変換する
     * 
     * 表示全体の文字数が
     * Config.MAX_DIGITS 以内になるよう調整する
     * 
     * @param value 変換対象の数値
     * @returns 指数表記文字列
     */
    private static formatExponential(value: number): string {

        console.debug("指数表記変換開始", { value });

        for (let fraction = 10; fraction >= 0; fraction--) {

            const text = value.toExponential(fraction);
            
            console.debug("指数表示候補", {
                fraction,
                text,
                length: text.length
            });

            if (this.isFits(text)) {
                return text;
            }
        }

        return value.toExponential(0);
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
     * 表示文字列が最大表示桁数以内か判定する
     * 
     * 指数表記の場合も e や符号を含めた
     * 表示全体の文字数で判定する
     * 
     * @param text 表示対象文字列
     * @returns 表示可能な場合 true
     */
    private static isFits(text: string): boolean {
        const length = text.length;

        console.debug("表示桁数チェック", {
            text,
            length,
            max: Config.MAX_DIGITS
        });

        return length <= Config.MAX_DIGITS;
    }
}