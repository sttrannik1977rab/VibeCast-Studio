/**
 * Преобразует секунды в формат "M:SS".
 * 
 * @param seconds - Количество секунд (может быть дробным)
 * @returns Строка в формате "M:SS". Если значение некорректно (NaN, Infinity, отрицательное) — возвращает "0:00".
 * 
 * @example
 * formatTime(9.36)   // "0:09"
 * formatTime(335.5)  // "5:35"
 * formatTime(4567.8) // "76:07"
 */
export function formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) {
        return '0:00';
    }

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}