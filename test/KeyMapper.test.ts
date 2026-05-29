import { describe, it, expect, beforeEach } from "vitest";
import { KeyMapper } from "../src/ui/KeyMapper";
import { Operation } from "../src/domain/Operation";
import type { KeyToken } from "../src/ui/KeyToken";

describe("KeyMapper", () => {
    let keyMap: Map<string, KeyToken>;
    let mapper: KeyMapper;

    beforeEach(() => {
        keyMap = new Map([
            ["+", { kind: "operation", value: Operation.Add }],
            ["-", { kind: "operation", value: Operation.Subtract }],
            ["*", { kind: "operation", value: Operation.Multiply }],
            ["/", { kind: "operation", value: Operation.Divide }],
            ["=", { kind: "equal" }],
            ["AC", { kind: "allClear" }],
            [".", { kind: "decimal" }],
        ]);

        mapper = new KeyMapper(keyMap);
    });

    describe("toKeyToken", () => {
        it.each([
            ["0", 0],
            ["1", 1],
            ["2", 2],
            ["3", 3],
            ["4", 4],
            ["5", 5],
            ["6", 6],
            ["7", 7],
            ["8", 8],
            ["9", 9],
        ])("'%s' を digit(%d) に変換する", (input, expected) => {
            expect(mapper.toKeyToken(input)).toEqual({
                kind: "digit",
                value: expected
            });
        });

        it.each([
            ["+", Operation.Add],
            ["-", Operation.Subtract],
            ["*", Operation.Multiply],
            ["/", Operation.Divide],
        ])("'%s' を operation(%s) に変換する", (input, operation) => {
            expect(mapper.toKeyToken(input)).toEqual({
                kind: "operation",
                value: operation
            });
        });

        it.each<[string, KeyToken]>([
            ["=", { kind: "equal" }],
            ["AC", { kind: "allClear" }],
            [".", { kind: "decimal" }],
        ])("'%s' を %o に変換する", (input, expected) => {
            expect(mapper.toKeyToken(input)).toEqual(expected);
        });

        it.each([
            "",
            "abc",
            "@",
            "10",
        ])("'%s' は null を返す", (input) => {
            expect(mapper.toKeyToken(input)).toBeNull();
        });

        it("空白文字は null を返す", () => {
            expect(mapper.toKeyToken(" ")).toBeNull();
        });

        it("undefined は null を返す", () => {
            expect(mapper.toKeyToken(undefined)).toBeNull();
        });

        it("null は null を返す", () => {
            expect(mapper.toKeyToken(null)).toBeNull();
        });
    });

    describe("resolve", () => {
        it("data-key 属性から KeyToken に変換する", () => {
            const button = document.createElement("button");
            button.dataset.key = "+";

            expect(mapper.resolve(button)).toEqual({
                kind: "operation",
                value: Operation.Add
            });
        });

        it("data-key が存在しない場合は null", () => {
            const button = document.createElement("button");

            expect(mapper.resolve(button)).toBeNull();
        });

        it("HTMLElement でない場合は null", () => {
            const target = {} as EventTarget;

            expect(mapper.resolve(target)).toBeNull();
        });

        it("null の場合は null", () => {
            expect(mapper.resolve(null)).toBeNull();
        });
    });
});