import { describe, it, expect } from "vitest";
import { Operation } from "../src/domain/Operation";
import { Evaluator } from "../src/domain/Evaluator";
import { DivisionByZeroError } from "../src/utility/DivisionByZeroError";

describe("Evaluator.compute", () => {
    it("加算できる", () => {
        expect(Evaluator.compute(4, Operation.Add, 2)).toBe(6);
    });

    it("減算できる", () => {
        expect(Evaluator.compute(4, Operation.Subtract, 2)).toBe(2);
    });

    it("乗算できる", () => {
        expect(Evaluator.compute(4, Operation.Multiply, 2)).toBe(8);
    });

    it("除算できる", () => {
        expect(Evaluator.compute(4, Operation.Divide, 2)).toBe(2);
    });

    it("0で割るとエラーになる", () => {
        expect(() => {
            Evaluator.compute(4, Operation.Divide, 0);
        }).toThrow(DivisionByZeroError);
    });
});