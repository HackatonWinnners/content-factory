// Tiny WAV duration parser. Avoids pulling in ffprobe / music-metadata for the
// hackathon. Handles standard PCM WAV (which is what Gradium returns).
// Walks RIFF chunks until it finds "fmt " (for byte rate) and "data" (for
// payload size). duration = data_size / byte_rate.

import { readFileSync } from "node:fs";

export function parseWavDuration(buf: Buffer): number {
	if (
		buf.length < 44 ||
		buf.toString("ascii", 0, 4) !== "RIFF" ||
		buf.toString("ascii", 8, 12) !== "WAVE"
	) {
		throw new Error("not a WAV file");
	}

	let offset = 12;
	let byteRate: number | undefined;
	while (offset + 8 <= buf.length) {
		const chunkId = buf.toString("ascii", offset, offset + 4);
		const chunkSize = buf.readUInt32LE(offset + 4);
		if (chunkId === "fmt ") {
			// fmt subchunk layout: audioFormat(2) numChannels(2) sampleRate(4)
			// byteRate(4) blockAlign(2) bitsPerSample(2)
			byteRate = buf.readUInt32LE(offset + 8 + 8);
		} else if (chunkId === "data") {
			if (!byteRate || byteRate === 0) {
				throw new Error("WAV missing fmt chunk before data");
			}
			// Streamed WAVs (Gradium does this) write 0xFFFFFFFF as the data
			// chunk size when it can't be known up front. Fall back to using the
			// remaining file length.
			const dataStart = offset + 8;
			const effectiveSize =
				chunkSize === 0xffffffff ? buf.length - dataStart : chunkSize;
			return effectiveSize / byteRate;
		}
		offset += 8 + chunkSize + (chunkSize % 2); // chunks are word-aligned
	}
	throw new Error("WAV missing data chunk");
}

export function readWavDurationSeconds(filePath: string): number {
	return parseWavDuration(readFileSync(filePath));
}
