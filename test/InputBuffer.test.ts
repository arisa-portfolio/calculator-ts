import { describe, it, expect, beforeEach } from 'vitest';
import { InputBuffer } from "../src/domain/InputBuffer";
import { Config } from '../src/utility/Config';

describe("InputBuffer", () => {
    let buffer: InputBuffer;

    beforeEach(() => {
        buffer = new InputBuffer();
    });

    describe("初期状態", () => {
        it("空文字で初期化される", () => {
            expect(buffer.getValue()).toBe("");
        });

        it("空状態である", () => {
            expect(buffer.isEmpty()).toBe(true);
        });

        it("toNumber は 0 を返す", () => {
            expect(buffer.toNumber()).toBe(0);
        });
    });

    describe("数字入力", () => {
        it("数字を順番に追加できる", () => {
            buffer.pushDigit(1);
            buffer.pushDigit(2);
            buffer.pushDigit(3);

            expect(buffer.getValue()).toBe("123");
        });

        it("先頭の 0 を置き換える", () => {
            buffer.pushDigit(0);
            buffer.pushDigit(5);

            expect(buffer.getValue()).toBe("5");
        });

        it("最大桁数を超える入力は無視する", () => {
            for (let i = 0; i < Config.MAX_DIGITS + 2; i++) {
                buffer.pushDigit(1);
            }

            expect(buffer.digitCount()).toBe(Config.MAX_DIGITS);
            expect(buffer.getValue().length).toBe(Config.MAX_DIGITS);
        });
    });

    describe("小数入力", () => {
        it("小数点を追加できる", () => {
            buffer.pushDigit(1);
            buffer.pushDecimal();

            expect(buffer.getValue()).toBe("1.");
        });

        it("空文字の場合は 0. を補完する", () => {
            buffer.pushDecimal();

            expect(buffer.getValue()).toBe("0.");
        });

        it("小数点は2回入力できない", () => {
            buffer.pushDecimal();
            buffer.pushDecimal();

            expect(buffer.getValue()).toBe("0.");
        });
    });

    describe("マイナス入力", () => {
        it("空状態では - になる", () => {
            buffer.pushMinus();

            expect(buffer.getValue()).toBe("-");
        });

        it("入力済みの場合は先頭に - が付く", () => {
            buffer.pushDigit(5);
            buffer.pushMinus();

            expect(buffer.getValue()).toBe("-5");
        });

        it("2回入力しても - は重複しない", () => {
            buffer.pushMinus();
            buffer.pushMinus();

            expect(buffer.getValue()).toBe("-");
        });

        it("- のみの場合 trueになる", () => {
            buffer.pushMinus();

            expect(buffer.isOnlyMinus()).toBe(true);
        });

        it("- 以外の場合 falseになる", () => {
            buffer.pushDigit(5);

            expect(buffer.isOnlyMinus()).toBe(false);
        });
    });

    describe("クリア", () => {
        it("値を空文字にする", () => {
            buffer.pushDigit(9);

            buffer.clear();

            expect(buffer.getValue()).toBe("");
            expect(buffer.isEmpty()).toBe(true);
        });
    });

    describe("バックスペース", () => {
        it("末尾の1文字を削除できる", () => {
            buffer.pushDigit(1);
            buffer.pushDigit(2);
            buffer.pushDigit(3);

            buffer.backspace();

            expect(buffer.getValue()).toBe("12");
        });

        it("空状態で実行しても変化しない", () => {
            buffer.backspace();

            expect(buffer.getValue()).toBe("");
        });
    });

    describe("値設定", () => {
        it("文字列を直接設定できる", () => {
            buffer.setValue("123");

            expect(buffer.getValue()).toBe("123");
        });
    });

    describe("数値変換", () => {
        it("整数文字列を数値に変換できる", () => {
            buffer.pushDigit(1);
            buffer.pushDigit(2);

            expect(buffer.toNumber()).toBe(12);
        });

        it("小数文字列を数値に変換できる", () => {
            buffer.pushDigit(1);
            buffer.pushDecimal();
            buffer.pushDigit(5);

            expect(buffer.toNumber()).toBe(1.5);
        });
    });

    describe("桁数", () => {
        it("小数点を除いた桁数を返す", () => {
            buffer.pushDigit(1);
            buffer.pushDecimal();
            buffer.pushDigit(2);

            expect(buffer.digitCount()).toBe(2);
        });

        it("マイナス記号を除いた桁数を返す", () => {
            buffer.pushMinus();
            buffer.pushDigit(1);
            buffer.pushDigit(2);

            expect(buffer.digitCount()).toBe(2);
        });
    });
});