import { describe, it, expect, vi, beforeEach } from 'vitest';
import logger from '../utils/logger';

describe('Logger Utility', () => {
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => { });
        vi.spyOn(console, 'error').mockImplementation(() => { });
        vi.spyOn(console, 'warn').mockImplementation(() => { });
    });

    it('should log messages in development mode', () => {
        // Mock DEV to true
        // Note: import.meta.env.DEV is handled by Vitest/Vite transform
        logger.log('test log');
        // If we are in test env, Vitest usually sets it up
        // We just check if it calls console.log
        expect(console.log).toHaveBeenCalled();
    });

    it('should always log errors', () => {
        logger.error('test error');
        expect(console.error).toHaveBeenCalledWith('test error');
    });

    it('should log warnings', () => {
        logger.warn('test warning');
        expect(console.warn).toHaveBeenCalled();
    });
});
