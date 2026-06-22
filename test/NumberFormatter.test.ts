import { describe, it, expect } from "vitest";
import { NumberFormatter } from "../src/domain/NumberFormatter";
import { Config } from "../src/utility/Config";

describe("NumberFormatter", () => {
    describe("通常表示", () => {
        it("整数はそのまま表示される", () => {
            expect(NumberFormatter.format(123)).toBe("123");
        });

        it("0 はそのまま表示される", () => {
            expect(NumberFormatter.format(0)).toBe("0");
        });

        it("-0 は 0 に変換される", () => {
            expect(NumberFormatter.format(-0)).toBe("0");
        });

        it("小数の末尾 0は削除される", () => {
            expect(NumberFormatter.format(1.2300)).toBe("1.23");
        });

        it("不要な小数点は削除される", () => {
            expect(NumberFormatter.format(1.0)).toBe("1");
        });

        it("負の小数も正しく処理される", () => {
            expect(NumberFormatter.format(-1.23)).toBe("-1.23");
        });
    });
    
    describe("有効数字 8桁以内", () => {
        it("8桁以内の整数は通常表示される", () => {
            expect(NumberFormatter.format(12345678)).toBe("12345678");
        });

        it("小数も有効数字 8桁以内なら通常表示される", () => {
            expect(NumberFormatter.format(0.1234567)).toBe("0.1234567");
        });

        it("マイナス記号は有効数字に含めない", () => {
            expect(NumberFormatter.format(-12345678)).toBe("-12345678");
        });
    });

    describe("指数表記", () => {
        it("8桁を超える整数は指数表記になる", () => {            
            expect(NumberFormatter.format(123456789)).toBe("1.2345679e+8");
        });

        it("非常に小さい数は指数表記になる", () => {
            expect(NumberFormatter.format(0.000000012345678)).toBe("1.2345678e-8");
        });

        it("指数表記でも有効数字は 8桁以内になる", () => {
            const result = NumberFormatter.format(123456789);

            const mantissa = result.split("e")[0];
            
            const digits =
                mantissa
                    .replace(/[.\-]/g, "")
                    .length;

            expect(digits).toBeLessThanOrEqual(Config.MAX_SIGNIFICANT_DIGITS);
        });
    });

    describe("浮動小数点誤差対策", () => {
        it("計算誤差が表示されない", () => {
            const result = 0.1234567 * 0.1;

            expect(NumberFormatter.format(result)).toBe("1.234567e-2");
        });

        it("0.1 + 0.2 の誤差が表示されない", () => {
            const result = 0.1 + 0.2;

            expect(NumberFormatter.format(result)).toBe("0.3");
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
});