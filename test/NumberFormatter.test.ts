import { describe, it, expect } from "vitest";
import { NumberFormatter } from "../src/domain/NumberFormatter";
import { Config } from "../src/utility/Config";

describe("NumberFormatter", () => {
    describe("基本動作", () => {
        it("整数はそのまま表示される", () => {
            expect(NumberFormatter.format(123)).toBe("123");
        });

        it("-0 は 0 に変換される", () => {
            expect(NumberFormatter.format(-0)).toBe("0");
        });

        it("小数の末尾の0は削除される", () => {
            expect(NumberFormatter.format(1.2300)).toBe("1.23");
        });

        it("不要な小数点は削除される", () => {
            expect(NumberFormatter.format(1.0)).toBe("1");
        });
    });
    
    describe("桁数制限", () => {
        it("8桁以内は通常表示される", () => {
            expect(NumberFormatter.format(12345678)).toBe("12345678");
        });

        it("マイナス記号は桁数に含めない", () => {
            expect(NumberFormatter.format(-12345678)).toBe("-12345678");
        });

        it("小数点は桁数に含めない", () => {
            expect(NumberFormatter.format(0.1234567)).toBe("0.1234567");
        });
    });

    describe("指数表記", () => {
        it("大きい数は指数表記になる", () => {            
            expect(NumberFormatter.format(123456789)).toBe("1.2345679e+8");
        });

        it("小さい数は指数表記になる", () => {
            expect(NumberFormatter.format(0.00000012345679)).toBe("1.2345679e-7");
        });

        it("指数表記は有効数字8桁以内", () => {
            const result = NumberFormatter.format(0.001234567);
            
            const mantissa =
                result.split("e")[0]
                    .replace(".", "")
                    .replace("-", "");
            
            expect(mantissa.length).toBeLessThanOrEqual(Config.MAX_SIGNIFICANT_DIGITS);
        });
    });

    describe("境界値", () => {
        it("ちょうど8桁は通常表示", () => {
            expect(NumberFormatter.format(99999999)).toBe("99999999");
        });

        it("8桁を超えた瞬間に指数表記", () => {
            expect(NumberFormatter.format(100000000)).toBe("1e+8");
        });

        it("小数でも8桁以内なら通常表示", () => {
            expect(NumberFormatter.format(0.9999999)).toBe("0.9999999");
        });

        it("小数で桁数オーバーすると指数表記", () => {
            expect(NumberFormatter.format(0.123456789)).toBe("1.2345679e-1");
        });

        it("指数表記になる最小値を確認する", () => {
            expect(NumberFormatter.format(0.00000001)).toBe("1e-8")
        });
    });

    describe("特殊ケース", () => {
        it("0 はそのまま表示", () => {
            expect(NumberFormatter.format(0)).toBe("0");
        });

        it("負の小数も正しく処理される", () => {
            expect(NumberFormatter.format(-1.23)).toBe("-1.23");
        });
    });
});