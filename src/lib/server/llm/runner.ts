import { spawn } from 'node:child_process';
import { rm } from 'node:fs/promises';

const DEFAULT_TIMEOUT_MS = 60_000;

export interface PreparedCommand {
	label: string;
	command: string;
	args: string[];
	stdin: string;
	timeoutMs?: number;
	outputFiles?: {
		lastMessage?: string;
	};
	cleanupPaths?: string[];
}

export interface CommandResult {
	stdout: string;
	stderr: string;
	durationMs: number;
}

export type CommandRunner = (command: PreparedCommand) => Promise<CommandResult>;

export function runCommand(command: PreparedCommand): Promise<CommandResult> {
	return new Promise((resolve, reject) => {
		const timeoutMs = command.timeoutMs ?? DEFAULT_TIMEOUT_MS;
		const t0 = Date.now();
		const ts = () => `+${((Date.now() - t0) / 1000).toFixed(1)}s`;

		console.log(
			`[${command.label} ${ts()}] spawning: ${command.command} ${command.args.join(' ')}`,
		);
		console.log(`[${command.label} ${ts()}] stdin length: ${command.stdin.length} chars`);

		const proc = spawn(command.command, command.args, { stdio: ['pipe', 'pipe', 'pipe'] });
		const startedAt = Date.now();

		console.log(`[${command.label} ${ts()}] process spawned (pid: ${proc.pid})`);

		let stdout = '';
		let stderr = '';
		let settled = false;
		let firstStdout = true;
		let firstStderr = true;

		const timeout = setTimeout(() => {
			if (settled) return;
			settled = true;
			console.log(`[${command.label} ${ts()}] TIMEOUT after ${timeoutMs}ms; killing process`);
			proc.kill('SIGTERM');
			reject(
				new Error(
					`${command.label} timed out after ${timeoutMs}ms (args: ${command.args.join(' ')}). stderr: ${stderr.trim()}`,
				),
			);
		}, timeoutMs);

		proc.stdout.on('data', (data: Buffer) => {
			if (firstStdout) {
				console.log(`[${command.label} ${ts()}] first stdout chunk (${data.length} bytes)`);
				firstStdout = false;
			}
			stdout += data.toString();
		});

		proc.stderr.on('data', (data: Buffer) => {
			const chunk = data.toString();
			if (firstStderr) {
				console.log(`[${command.label} ${ts()}] first stderr: ${chunk.trim().slice(0, 200)}`);
				firstStderr = false;
			}
			stderr += chunk;
		});

		proc.on('close', (code) => {
			if (settled) {
				clearTimeout(timeout);
				return;
			}
			settled = true;
			clearTimeout(timeout);
			const durationMs = Date.now() - startedAt;

			console.log(
				`[${command.label} ${ts()}] exited code=${code}, stdout=${stdout.length} bytes, stderr=${stderr.length} bytes, duration=${durationMs}ms`,
			);

			if (code !== 0) {
				console.log(`[${command.label} ${ts()}] stderr: ${stderr.trim().slice(0, 500)}`);
				reject(
					new Error(
						`${command.label} exited with code ${code} after ${durationMs}ms (args: ${command.args.join(' ')}). stderr: ${stderr.trim()}`,
					),
				);
				return;
			}

			resolve({ stdout, stderr, durationMs });
		});

		proc.on('error', (err) => {
			settled = true;
			clearTimeout(timeout);
			console.log(`[${command.label} ${ts()}] spawn error: ${err.message}`);
			reject(new Error(`Failed to spawn ${command.command}: ${err.message}`));
		});

		proc.stdin.write(command.stdin);
		proc.stdin.end();
	});
}

export async function cleanupPreparedCommand(command: PreparedCommand): Promise<void> {
	for (const path of command.cleanupPaths ?? []) {
		await rm(path, { recursive: true, force: true });
	}
}
