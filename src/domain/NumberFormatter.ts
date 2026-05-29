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
     * 数値を指数表記に変換する
     * 桁数制限内に収まるよう調整する
     * 
     * @param value 変換対象の数値
     * @returns 指数表記文字列
     */
    private static formatExponential(value: number): string {
        console.debug("指数表記変換開始", { value });

        for (let i = 6; i >= 0; i--) {
            let text = value.toExponential(i);
            
            console.debug("試行", { i, text });

            // e+ の + を削る
            text = text.replace("e+", "e");

            if (this.isFits(text)) {
                return text;
            }
        }

        return value.toExponential(0).replace("e+", "e");
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
     * 表示桁数に収まるか
     * ".", "-", "e", "+" は桁数カウントから除外
     */
    private static isFits(text: string): boolean {
        return this.digitCount(text) <= Config.MAX_DIGITS;
    }

    /**
     * 数字の桁数を数える
     */
    private static digitCount(text: string): number {
        return text.replace(/[.\-e+]/g, "").length;
    }
}