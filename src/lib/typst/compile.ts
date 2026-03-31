import { spawn } from 'node:child_process';
import type { DraftData } from '$lib/types';
import templateSource from './reponse-technique.typ?raw';

const TIMEOUT_MS = 10_000;

export function compilePdf(data: DraftData): Promise<Uint8Array> {
	const payload = JSON.stringify(data);

	return new Promise((resolve, reject) => {
		const proc = spawn('typst', ['compile', '--input', `payload=${payload}`, '-', '-'], {
			stdio: ['pipe', 'pipe', 'pipe'],
		});

		const chunks: Buffer[] = [];
		let stderr = '';
		let settled = false;

		const timeout = setTimeout(() => {
			if (settled) return;
			settled = true;
			proc.kill('SIGTERM');
			reject(new Error(`typst compile timed out after ${TIMEOUT_MS}ms`));
		}, TIMEOUT_MS);

		proc.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
		proc.stderr.on('data', (chunk: Buffer) => {
			stderr += chunk.toString();
		});

		proc.on('close', (code) => {
			if (settled) return;
			settled = true;
			clearTimeout(timeout);
			if (code !== 0) {
				reject(new Error(`typst compile failed (code ${code}): ${stderr.trim()}`));
			} else {
				resolve(new Uint8Array(Buffer.concat(chunks)));
			}
		});

		proc.on('error', (err) => {
			if (settled) return;
			settled = true;
			clearTimeout(timeout);
			reject(new Error(`Failed to spawn typst: ${err.message}`));
		});

		proc.stdin.write(templateSource as string);
		proc.stdin.end();
	});
}
