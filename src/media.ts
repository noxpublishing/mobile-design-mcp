import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { copyFile, mkdir, open, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { extname, isAbsolute, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { Platform, Recording } from './types.js';
import type { Store } from './store.js';
const exec = promisify(execFile);
const MIME: Record<string, Recording['mediaType']> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime' };

export async function importRecording(store: Store, input: {
  path: string; title: string; platform: Platform; appId?: string; appVersion?: string; osVersion?: string; capturedAt?: string; tags?: string[];
}) {
  if (!isAbsolute(input.path)) throw new Error('Provide an absolute local image or recording path.');
  if (input.appId) {
    const app=store.getApp(input.appId);
    if(!app)throw new Error('Unknown appId; import or select a reference app first, or omit appId.');
    if(!app.platforms.includes(input.platform))throw new Error('Capture platform does not match the reference app.');
  }
  const source = await realpath(input.path); const info = await stat(source);
  if (!info.isFile() || info.size === 0 || info.size > 500 * 1024 * 1024) throw new Error('Expected a nonempty regular file of at most 500 MiB.');
  const extension = extname(source).toLowerCase(); const mediaType = MIME[extension];
  if (!mediaType) throw new Error('Supported formats: PNG, JPEG, MP4, WebM, MOV.');
  const file = await open(source, 'r'); const header = Buffer.alloc(16);
  try { await file.read(header, 0, header.length, 0); } finally { await file.close(); }
  const valid = mediaType === 'image/png' ? header.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : mediaType === 'image/jpeg' ? header[0] === 255 && header[1] === 216 && header[2] === 255
    : mediaType === 'video/webm' ? header.readUInt32BE(0) === 0x1a45dfa3
    : header.toString('ascii',4,8) === 'ftyp';
  if (!valid) throw new Error('Media signature does not match the file extension.');
  const hash = createHash('sha256'); for await (const chunk of createReadStream(source)) hash.update(chunk);
  const sha256 = hash.digest('hex');
  const capturedAt = input.capturedAt ?? new Date(info.mtimeMs).toISOString();
  const captureTags = [...new Set(input.tags ?? [])].sort();
  // Byte identity is separate from the circumstances in which those bytes were captured.
  const context = {sha256,platform:input.platform,sourcePath:source,title:input.title,appId:input.appId,
    appVersion:input.appVersion,osVersion:input.osVersion,capturedAt,tags:captureTags};
  const contextHash = createHash('sha256').update(JSON.stringify(context)).digest('hex');
  const id = `capture-${input.platform}-${contextHash.slice(0,20)}`;
  const existing = store.getRecording(id); if (existing) return { recording: existing, duplicate: true };
  const dir = join(store.root, 'media'); await mkdir(dir, { recursive: true });
  const storedPath = join(dir, sha256 + extension); await copyFile(source, storedPath);
  // Recheck copied bytes so a file changing during import cannot receive the wrong identity.
  const copied = createHash('sha256'); for await (const chunk of createReadStream(storedPath)) copied.update(chunk);
  if (copied.digest('hex') !== sha256) throw new Error('Source file changed during import; retry after it stops changing.');
  const recording: Recording = { id, title: input.title, platform: input.platform, appId: input.appId, appVersion: input.appVersion,
    osVersion: input.osVersion, capturedAt, capturedAtBasis: input.capturedAt ? 'user-provided' : 'file-mtime-estimate', sourcePath: source,
    storedPath, sha256, mediaType, bytes: info.size, tags: captureTags };
  store.putRecording(recording); return { recording, duplicate: false, capturedAtBasis: input.capturedAt ? 'user-provided' : 'file-mtime-estimate' };
}

export async function probeVideo(recording: Recording) {
  if (!recording.mediaType.startsWith('video/')) throw new Error('A video is required; a screenshot has no timing evidence.');
  const { stdout } = await exec('ffprobe', ['-v','error','-show_streams','-show_format','-of','json',recording.storedPath], { timeout: 10000, maxBuffer: 1024 * 1024 });
  const meta = JSON.parse(stdout); const stream = meta.streams?.find((s: {codec_type: string}) => s.codec_type === 'video');
  if (!stream) throw new Error('No decodable video stream.');
  const durationMs = Number(meta.format?.duration) * 1000;
  if (!Number.isFinite(durationMs) || durationMs <= 0) throw new Error('The video has no measured positive duration.');
  return {stream,durationMs};
}

export async function analyzeTransition(store: Store, args: { recordingId: string; startMs: number; endMs: number; frames?: number }) {
  const recording = store.getRecording(args.recordingId);
  if (!recording) throw new Error('Unknown recording.');
  if (args.endMs <= args.startMs || args.endMs - args.startMs > 30000) throw new Error('Choose a positive interval of at most 30 seconds.');
  const {stream,durationMs}=await probeVideo(recording);
  if (args.endMs > durationMs + 1) throw new Error('Selected interval extends beyond the measured video duration.');
  const count = Math.min(12, Math.max(3, args.frames ?? 6));
  const key = createHash('sha256').update(`${recording.id}:${recording.sha256}:${args.startMs}:${args.endMs}:${count}`).digest('hex').slice(0,20);
  const out = join(store.root, 'studies', key); await mkdir(out,{recursive:true});
  try {
    const cached=JSON.parse(await readFile(join(out,'study.json'),'utf8'));
    if(cached.recordingId===recording.id&&cached.recordingSha256===recording.sha256&&cached.frames?.length===count){
      const valid=await Promise.all(cached.frames.map(async(frame:{path:string;sha256?:string})=>frame.sha256===createHash('sha256').update(await readFile(frame.path)).digest('hex')));
      if(valid.every(Boolean))return {...cached,cacheHit:true};
    }
  }catch{ /* Regenerate incomplete or superseded study artifacts. */ }
  const frames: Array<{path: string;requestedTimestampMs: number;sha256:string}> = [];
  for (let i=0;i<count;i++) {
    const timestamp = args.startMs + (args.endMs-args.startMs) * i / count;
    const path = join(out, `frame-${i+1}.jpg`);
    await exec('ffmpeg',['-nostdin','-v','error','-y','-ss',String(timestamp/1000),'-i',recording.storedPath,'-frames:v','1','-vf',"scale='min(480,iw)':-2",path],{timeout:15000,maxBuffer:1024*1024});
    if (!(await stat(path)).size) throw new Error('Frame extraction returned an empty file.');
    frames.push({path,requestedTimestampMs:Math.round(timestamp),sha256:createHash('sha256').update(await readFile(path)).digest('hex')});
  }
  const result = { schema:'mobile-motion-study-v1',recordingId:recording.id,recordingSha256:recording.sha256,
    platform:recording.platform,selectedIntervalMs:args.endMs-args.startMs,videoDurationMs:durationMs,
    dimensions:{width:stream.width,height:stream.height},reportedFrameRate:stream.avg_frame_rate,frames,
    evidenceStatus:'observed-media', cacheHit:false, measured:{easing:null,spring:null,haptics:null,gesture:null,transitionDurationMs:null},
    limitations:['Frame positions are requested seek times, not verified input-event timestamps.','Selected interval length is not a measured transition duration.','Frames do not establish original spring constants, easing, gestures, haptics, native layout tokens or source code.','Review the frames and label any inferred motion separately.'] };
  await writeFile(join(out,'study.json'),JSON.stringify(result,null,2)+'\n'); return result;
}

export async function recordingPreview(recording: Recording) {
  if (!recording.mediaType.startsWith('image/')) return null;
  if (recording.bytes > 3 * 1024 * 1024) return null;
  return { type:'image' as const, data:(await readFile(recording.storedPath)).toString('base64'), mimeType:recording.mediaType };
}
