import type { Operation } from "../domain/Operation";

export type KeyToken =
| { kind: "digit"; value: number }
| { kind: "decimal" }
| { kind: "operation"; value: Operation }
| { kind: "equal" }
| { kind: "allClear" }
| { kind: "backspace" };