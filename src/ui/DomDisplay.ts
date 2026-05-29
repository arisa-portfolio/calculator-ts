import type { IDisplay } from "./IDisplay";

/**
 * DOM へ表示を描画するクラス
 */
export class DomDisplay implements IDisplay {
    constructor(
        private readonly element: HTMLElement,
        private readonly historyElement: HTMLElement
    ) {}

    /**
     * 表示文字列を描画する
     * @param text 表示内容
     */
    public render(text: string): void {
        this.element.textContent = text;
    }
    
    /**
     * エラーメッセージを描画する
     * @param message エラーメッセージ
    */
   public renderError(message: string): void {
       this.element.textContent = message;
    }

    /**
     * 計算履歴を描画する
     * @param text 表示内容
     */
    renderHistory(text: string): void {
        this.historyElement.textContent = text;
    }
}