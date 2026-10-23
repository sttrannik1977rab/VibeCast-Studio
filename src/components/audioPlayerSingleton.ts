/**
 * Синглтон для аудиоплеера.
 * 
 * Гарантирует, что плеер создаётся один раз за всё время жизни приложения
 * и не пересоздаётся при переходах между страницами.
 */

import { AudioPlayer } from './AudioPlayer';

export const audioPlayerInstance = new AudioPlayer();