/**
 * 電卓アプリの設定値
 */
type ConfigType = {
    /** 最大表示桁数 */
    readonly MAX_DIGITS: number;

    /** 最大有効数字桁数 */
    readonly MAX_SIGNIFICANT_DIGITS: number;

    /** エラー発生時に表示するメッセージ */
    readonly ERROR_MESSAGE: string;
};

export const Config = {
    /** 最大表示桁数：8桁 */
    MAX_DIGITS: 8,

    /** 最大有効数字桁数：8桁 */
    MAX_SIGNIFICANT_DIGITS: 8,

    /** エラー発生時に表示するメッセージ */
    ERROR_MESSAGE: "エラー",
} satisfies ConfigType;