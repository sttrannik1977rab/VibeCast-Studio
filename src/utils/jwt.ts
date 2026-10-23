/**
 * Утилиты для работы с JWT-токеном.
 * 
 * Декодирует payload без проверки подписи (проверка — на сервере).
 */

export interface JwtPayload {
    username?: string;
    email?: string;
    iat?: number;
    exp?: number;
}

/**
 * Декодирует payload JWT-токена.
 * 
 * @param token - JWT-токен
 * @returns Объект с данными пользователя или пустой объект, если декодирование не удалось
 * 
 * @example
 * const payload = decodeJwt(token);
 * console.log(payload.username); // 'testuser'
 */
export function decodeJwt(token: string): JwtPayload {
    try {
        const parts = token.split('.');

        if (parts.length !== 3) {
            console.warn('decodeJwt: некорректный токен (не 3 части)');
            return {};
        }

        const payloadBase64 = parts[1];

        // base64url → base64 (замена символов для atob)
        const payloadBase64Standard = payloadBase64
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const payloadJson = atob(payloadBase64Standard);
        const payload = JSON.parse(payloadJson) as JwtPayload;

        return payload;
    } catch (error) {
        console.error('decodeJwt: ошибка декодирования', error);
        return {};
    }
}
