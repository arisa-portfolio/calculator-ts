import { Calculator } from "./application/Calculator";
import { Operation } from "./domain/Operation";
import { DomDisplay } from "./ui/DomDisplay";
import { KeyMapper } from "./ui/KeyMapper";
import type { KeyToken } from "./ui/KeyToken";

// 表示用 DOM を取得
const displayElement = document.getElementById("display-value");
const historyElement = document.getElementById("history");

// DOM 要素チェック
if (!(displayElement instanceof HTMLElement) ||
    !(historyElement instanceof HTMLElement)) {
    throw new Error("表示要素が見つかりません");
}

// 表示レイヤー
const display = new DomDisplay(displayElement, historyElement);

// アプリケーション本体
const calculator = new Calculator(display);

// 初期表示
display.render("0");

// 入力 → ドメイン変換定義
const keyMap = new Map<string, KeyToken>([
    ["+", { kind: "operation", value: Operation.Add }],
    ["-", { kind: "operation", value: Operation.Subtract }],
    ["*", { kind: "operation", value: Operation.Multiply }],
    ["/", { kind: "operation", value: Operation.Divide }],
    ["=", { kind: "equal" }],
    ["C", { kind: "allClear" }],
    [".", { kind: "decimal" }],
    ["⌫", { kind: "backspace" }]
]);

const mapper = new KeyMapper(keyMap);

// イベント接続
document.addEventListener("click", (event) => {
    const token = mapper.resolve(event.target);

    if (token === null) {
        return;
    }

    console.debug("キー入力", {
        token,
        type: token.kind
    });

    calculator.handle(token);
});

// keydown イベント
document.addEventListener("keydown", (event) => {
    let token: KeyToken | null = null;

    switch (event.key) {
        case "Backspace":
            token = { kind: "backspace" };
            break;

        case "Enter":
        case "=":
            token = { kind: "equal" };
            break;

        case "+":
            token = { kind: "operation", value: Operation.Add };
            break;

        case "-":
            token = { kind: "operation", value: Operation.Subtract };
            break;

        case "*":
            token = { kind: "operation", value: Operation.Multiply };
            break;

        case "/":
            token = { kind: "operation", value: Operation.Divide };
            break;

        case ".":
            token = { kind: "decimal" };
            break;

        default:
            // 数字
            if (event.key >= "0" && event.key <= "9") {
                token = {
                    kind: "digit",
                    value: Number(event.key)
                };
            }
    }

    if (token === null) {
        return;
    }

    // ブラウザの戻る防止
    event.preventDefault();

    calculator.handle(token);
});