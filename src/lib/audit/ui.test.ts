import { describe, expect, it } from 'bun:test';
import { formatFileSize } from './ui';

describe('ui helpers', () => {
	it('formats file sizes in KB under 1 MB', () => {
		expect(formatFileSize(1024)).toBe('1 KB');
	});

	it('formats file sizes in MB at or above 1 MB', () => {
		expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
	});
});
