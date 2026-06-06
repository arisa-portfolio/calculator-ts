import type { KeyToken } from "./KeyToken";

/**
 * DOMイベントの対象要素から data-key を読み取り、
 * KeyToken に変換するクラス
 */
export class KeyMapper {
    private readonly keyMap: Map<string, KeyToken>;

    constructor(keyMap: Map<string, KeyToken>) {
        this.keyMap = keyMap;
    }

    /**
     * 数字キーは Map に持たず動的に生成（0〜9 の1桁のみ）
     * @param key 入力された文字列キー
     * @returns 0〜9 の1桁なら true
     */
    private isDigit(key: string): boolean {
        return /^[0-9]$/.test(key);
    }

    /**
     * 文字列キーを KeyToken に変換する
     * @param key 入力された文字列キー
     * @returns 変換された KeyToken。変換できない場合は null
     */
    public toKeyToken(key: string | undefined | null): KeyToken | null {
        if (!key) {
            return null;
        }

         // Map から固定キーを取得（例："+", "=", "C", "."）
        const token = this.keyMap.get(key);
        if (token !== undefined) {
            return token;
        }
        
        // 数字キー（0〜9）なら、数字に変換
        if (this.isDigit(key)) {
            return {
                kind: "digit",
                value: Number(key)
            };
        }
    
        // 該当なし（例："abc", "@"）
        return null;
    }

    /**
     * EventTarget（イベントの対象要素）から data-key を取得し、
     * KeyToken に変換する
     * 
     * @param target イベントの発生元（クリックされた要素など）
     * @returns 変換された KeyToken。変換できない場合は null
    */
    public resolve(target: EventTarget | null): KeyToken | null {
        if (!(target instanceof HTMLElement)) {
           return null;
        }
        
        // data-key 属性を取得（未設定・空文字は無効として扱う）
        const key = target.dataset.key?.trim();

        if (!key) {
            return null;
        }

        return this.toKeyToken(key);
    }
}