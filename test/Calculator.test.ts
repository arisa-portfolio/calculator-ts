import { describe, it, expect, beforeEach } from "vitest";
import { Calculator } from "../src/application/Calculator";
import { Operation } from "../src/domain/Operation";
import type { IDisplay } from "../src/ui/IDisplay";

/**
 * テスト用のダミー表示クラス
 * 
 * - text: メイン表示（数値・結果）
 * - history: 履歴表示（計算式）
 */
class FakeDisplay implements IDisplay {
    public text = "";
    public history = "";
    public error = "";

    render(text: string): void {
        this.text = text;
    }

    renderError(message: string): void {
        this.text = message;
    }

    renderHistory(text: string): void {
        this.history = text;
    }
}

describe("Calculator", () => {
    let calculator: Calculator;
    let display: FakeDisplay;

    beforeEach(() => {
        display = new FakeDisplay();
        calculator = new Calculator(display);
    });

    describe("数字入力", () => {
        it("数字入力で表示が更新される", () => {
            calculator.handle({ kind: "digit", value: 1 });
    
            expect(display.text).toBe("1");
        });

        it("数字を連続入力できる", () => {
            calculator.handle({ kind: "digit", value: 1 });
            calculator.handle({ kind: "digit", value: 2 });
            calculator.handle({ kind: "digit", value: 3 });
    
            expect(display.text).toBe("123");
        });

        it("小数入力できる", () => {
            calculator.handle({ kind: "digit", value: 1 });
            calculator.handle({ kind: "decimal" });
            calculator.handle({ kind: "digit", value: 5 });
    
            expect(display.text).toBe("1.5");
        });

        it("小数点を連続入力しても1つだけになる", () => {
            calculator.handle({ kind: "digit", value: 1 });
            calculator.handle({ kind: "decimal" });
            calculator.handle({ kind: "decimal" });
            calculator.handle({ kind: "digit", value: 5 });
    
            expect(display.text).toBe("1.5");
        });

        it("先頭で - を押すとマイナス入力になる", () => {
            calculator.handle({ kind: "operation", value: Operation.Subtract });
            calculator.handle({ kind: "digit", value: 1 });

            expect(display.text).toBe("-1");
        });
    });

    describe("四則演算", () => {
        it("加算できる", () => {
            calculator.handle({ kind: "digit", value: 1 });
            calculator.handle({ kind: "operation", value: Operation.Add });
            calculator.handle({ kind: "digit", value: 2 });
            calculator.handle({ kind: "equal" });
    
            expect(display.text).toBe("3");
        });
    
        it("減算できる", () => {
            calculator.handle({ kind: "digit", value: 1 });
            calculator.handle({ kind: "operation", value: Operation.Subtract });
            calculator.handle({ kind: "digit", value: 2 });
            calculator.handle({ kind: "equal" });
    
            expect(display.text).toBe("-1");
        });
    
        it("乗算できる", () => {
            calculator.handle({ kind: "digit", value: 1 });
            calculator.handle({ kind: "operation", value: Operation.Multiply });
            calculator.handle({ kind: "digit", value: 2 });
            calculator.handle({ kind: "equal" });
    
            expect(display.text).toBe("2");
        });
    
        it("除算できる", () => {
            calculator.handle({ kind: "digit", value: 4 });
            calculator.handle({ kind: "operation", value: Operation.Divide });
            calculator.handle({ kind: "digit", value: 2 });
            calculator.handle({ kind: "equal" });
    
            expect(display.text).toBe("2");
        });
    
        it("連続計算できる", () => {
            calculator.handle({ kind: "digit", value: 3 });
            calculator.handle({ kind: "operation", value: Operation.Add });
            calculator.handle({ kind: "digit", value: 2 });
            calculator.handle({ kind: "operation", value: Operation.Multiply });
            calculator.handle({ kind: "digit", value: 4 });
            calculator.handle({ kind: "equal" });
    
            expect(display.text).toBe("20");
        });
    });

    describe("演算子入力", () => {
        it("演算子入力中に + → - → × と押すと、最後の演算子で上書きされる", () => {
            calculator.handle({ kind: "digit", value: 1 });

            calculator.handle({ kind: "operation", value: Operation.Add });
            calculator.handle({ kind: "operation", value: Operation.Subtract });
            calculator.handle({ kind: "operation", value: Operation.Multiply });
            
            calculator.handle({ kind: "digit", value: 2 });
            calculator.handle({ kind: "equal" });

            expect(display.text).toBe("2");
        });
    });

    describe("履歴表示", () => {
        it ("初期状態では履歴は空", () => {
            expect(display.history).toBe("");
        });

        it("演算子入力で履歴が表示される", () => {
            calculator.handle({ kind: "digit", value: 1 });
            calculator.handle({ kind: "operation", value: Operation.Add });

            expect(display.history.trim()).toBe("1 +");
        });

        it("右辺入力中は履歴に反映される", () => {
            calculator.handle({ kind: "digit", value: 1 });
            calculator.handle({ kind: "operation", value: Operation.Add });
            calculator.handle({ kind: "digit", value: 2 });

            expect(display.history.trim()).toBe("1 + 2");
        });

        it("= 押下後、履歴に式と = が表示される", () => {
            calculator.handle({ kind: "digit", value: 1 });
            calculator.handle({ kind: "operation", value: Operation.Add });
            calculator.handle({ kind: "digit", value: 2 });
            calculator.handle({ kind: "equal" });

            expect(display.history.trim()).toBe("1 + 2 =");
        });
    });

    describe("結果表示後", () => {
        it("結果表示後に = を押しても値は変わらない", () => {
            calculator.handle({ kind: "digit", value: 1 });
            calculator.handle({ kind: "operation", value: Operation.Add });
            calculator.handle({ kind: "digit", value: 2 });
            calculator.handle({ kind: "equal" });
            calculator.handle({ kind: "equal" });
    
            expect(display.text).toBe("3");
        });

        it("結果表示後の数字入力は新しい計算を開始する", () => {
            calculator.handle({ kind: "digit", value: 1 });
            calculator.handle({ kind: "operation", value: Operation.Add });
            calculator.handle({ kind: "digit", value: 2 });
            calculator.handle({ kind: "equal" });
            calculator.handle({ kind: "digit", value: 5 });
    
            expect(display.text).toBe("5");
        });
    });

    describe("クリア操作", () => {
        it("AC を連続入力しても 0 表示のまま", () => {
            calculator.handle({ kind: "allClear" });
            calculator.handle({ kind: "allClear" });
    
            expect(display.text).toBe("0");
        });
    });

    describe("エラー処理", () => {
        it("0除算時はエラー表示する", () => {
            calculator.handle({ kind: "digit", value: 5 });
            calculator.handle({ kind: "operation", value: Operation.Divide });
            calculator.handle({ kind: "digit", value: 0 });
            calculator.handle({ kind: "equal" });
    
            expect(display.text).toBe("エラー");
        });
    
        it("エラー後に数字入力すると復帰する", () => {
            calculator.handle({ kind: "digit", value: 1 });
            calculator.handle({ kind: "operation", value: Operation.Divide });
            calculator.handle({ kind: "digit", value: 0 });
            calculator.handle({ kind: "equal" });
            calculator.handle({ kind: "digit", value: 7 });
    
            expect(display.text).toBe("7");
        });
    });
});