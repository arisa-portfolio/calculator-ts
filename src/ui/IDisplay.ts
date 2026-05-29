/**
 * 表示更新インターフェース
 */
export interface IDisplay {
    /**
     * 表示文字列を描画する
     * @param text 表示内容
     */
    render(text: string): void;
    
    /**
     * エラーメッセージを描画する
     * @param message エラーメッセージ
    */
   renderError(message: string): void;
   
   /**
    * 計算履歴を描画する
    * @param text 表示内容
    */
   renderHistory(text: string): void;
}