/**
 * 電卓アプリの設定値
 */
type ConfigType = {
    /** 入力できる数値の最大桁数：8桁 */
    readonly MAX_DIGITS: number;

    /** 初期値：0 */
    readonly DEFAULT_VALUE: string;

    /** エラー発生時に表示するメッセージ */
    readonly ERROR_MESSAGE: string;
};

export const Config = {
    /** 入力できる数値の最大桁数：8桁 */
    MAX_DIGITS: 8,

    /** 初期値：0 */
    DEFAULT_VALUE: "0",

    /** エラー発生時に表示するメッセージ */
    ERROR_MESSAGE: "エラー",
} satisfies ConfigType;