import { describe, expect, it } from 'bun:test';
import { formatFileSize } from './ui';

describe('ui helpers', () => {
	it('formats file sizes in Ko under 1 Mo', () => {
		expect(formatFileSize(1024)).toBe('1 Ko');
	});

	it('formats file sizes in Mo at or above 1 Mo', () => {
		expect(formatFileSize(1024 * 1024)).toBe('1.0 Mo');
	});
});
