"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AUDIO_GUESTBOOK_MAX_BYTES as MAX_UPLOAD_BYTES, AUDIO_GUESTBOOK_MAX_MS as MAX_RECORDING_MS } from "@/lib/guestbook";
import { DEMO_CODE } from "@/lib/db";

type Phase = "idle" | "starting" | "recording" | "processing" | "review" | "uploading" | "sent" | "demo";

function clock(ms: number) {
  const seconds = Math.floor(Math.max(0, ms) / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

/** A short, soft answering-machine tone played only after MediaRecorder successfully starts. */
function playStartBeep(context: AudioContext | null) {
  if (!context) return;
  const play = () => {
    if (context.state !== "running") {
      void context.close().catch(() => {});
      return;
    }
    try {
      const oscillator = context.createOscillator();
      const volume = context.createGain();
      const at = context.currentTime + 0.015;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, at);
      volume.gain.setValueAtTime(0.0001, at);
      volume.gain.exponentialRampToValueAtTime(0.16, at + 0.025);
      volume.gain.exponentialRampToValueAtTime(0.0001, at + 0.42);
      oscillator.connect(volume);
      volume.connect(context.destination);
      oscillator.onended = () => {
        oscillator.disconnect();
        volume.disconnect();
        if (context.state !== "closed") void context.close().catch(() => {});
      };
      oscillator.start(at);
      oscillator.stop(at + 0.44);
    } catch {
      void context.close().catch(() => {});
    }
  };
  if (context.state === "running") play();
  else void context.resume().then(play).catch(() => {
    if (context.state !== "closed") void context.close().catch(() => {});
  });
}

function microphoneMessage(cause: unknown) {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "Microphone needs a secure HTTPS invitation. Please open the secure link and try again.";
  }
  const name = cause && typeof cause === "object" && "name" in cause ? String(cause.name) : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    if (typeof window !== "undefined" && window.self !== window.top) return "This embedded preview may block the mic. Open it in a new tab and allow Microphone.";
    return "Mic access is blocked. Allow Microphone in this site’s browser settings, then tap again.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No microphone was found. Connect or enable one, then try again.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "Your microphone may be busy. Close the app using it and try again.";
  }
  return "We couldn’t start the microphone. Check browser permissions and try again.";
}

function RotaryPhone({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 180 140" fill="none" className={className}>
      <ellipse cx="90" cy="126" rx="65" ry="5" fill="currentColor" opacity=".12" />
      {/* Curved receiver and its earpieces */}
      <path d="M34 34C39 17 58 10 90 10s51 7 56 24l7 14c2 4-2 9-7 7l-15-5c-5-2-7-5-6-10l2-8c-22-9-52-9-74 0l2 8c1 5-1 8-6 10l-15 5c-5 2-9-3-7-7l7-14Z" fill="#E9DCCB" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="m35 42 19-6M145 42l-19-6M40 31c11-7 28-11 50-11s39 4 50 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity=".72" />
      {/* Curly telephone cord */}
      <path d="M30 50c-13-5-20 0-14 6 7 6 14 5 12 10-2 5-15 1-16 7-1 6 13 6 13 11 0 5-13 5-12 11 1 6 14 5 14 10 0 4-7 5-11 3" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      {/* Rotary-phone body */}
      <path d="M47 58h86l16 53c-17 9-39 13-59 13s-42-4-59-13l16-53Z" fill="#F7F0E5" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round" />
      <path d="M52 64h76M40 109c15 6 32 9 50 9s35-3 50-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".65" />
      {/* Rotary dial */}
      <circle cx="90" cy="88" r="23" fill="#EFE3D4" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="90" cy="88" r="15" stroke="currentColor" strokeWidth="1.4" opacity=".75" />
      <circle cx="90" cy="88" r="6.5" fill="#F7F0E5" stroke="currentColor" strokeWidth="1.6" />
      <g fill="currentColor">
        <circle cx="90" cy="69.5" r="2.2" /><circle cx="103" cy="75" r="2.2" />
        <circle cx="108.5" cy="88" r="2.2" /><circle cx="103" cy="101" r="2.2" />
        <circle cx="90" cy="106.5" r="2.2" /><circle cx="77" cy="101" r="2.2" />
        <circle cx="71.5" cy="88" r="2.2" /><circle cx="77" cy="75" r="2.2" />
      </g>
      <path d="M82 113h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PlayMark({ playing }: { playing: boolean }) {
  return playing
    ? <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h.2A1.3 1.3 0 0 1 9 4.3v11.4A1.3 1.3 0 0 1 7.7 17h-.2A1.5 1.5 0 0 1 6 15.5v-11Zm6 0A1.5 1.5 0 0 1 13.5 3h.2A1.3 1.3 0 0 1 15 4.3v11.4a1.3 1.3 0 0 1-1.3 1.3h-.2a1.5 1.5 0 0 1-1.5-1.5v-11Z" /></svg>
    : <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><path d="M5.7 3.9A1.8 1.8 0 0 1 8.4 2.4l8.1 6a1.95 1.95 0 0 1 0 3.2l-8.1 6a1.8 1.8 0 0 1-2.7-1.5V3.9Z" /></svg>;
}

const PROMPTS = ["Tap to record", "Wish · hello · prayer", "Tap to stop · 20 sec max", "Listen · redo · send"];

export default function VoiceGuestbook({ code }: { code: string }) {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { amount: 0.12 });
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [clip, setClip] = useState<Blob | null>(null);
  const [clipUrl, setClipUrl] = useState("");
  const [playing, setPlaying] = useState(false);
  const [playheadMs, setPlayheadMs] = useState(0);
  const [error, setError] = useState("");
  const [oversize, setOversize] = useState(false);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const alive = useRef(true);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const beepContext = useRef<AudioContext | null>(null);
  const canRecord = Boolean(code);

  useEffect(() => { setIsEmbedded(window.self !== window.top); }, []);

  useEffect(() => {
    if (!clipUrl) return;
    return () => URL.revokeObjectURL(clipUrl);
  }, [clipUrl]);

  useEffect(() => {
    if (phase !== "recording") return;
    const timer = window.setInterval(() => setElapsedMs(Math.min(MAX_RECORDING_MS, Date.now() - startedAt.current)), 100);
    const deadline = window.setTimeout(() => {
      setElapsedMs(MAX_RECORDING_MS);
      const active = recorder.current;
      if (active?.state === "recording") {
        setPhase("processing");
        active.stop();
      }
    }, Math.max(0, MAX_RECORDING_MS - (Date.now() - startedAt.current)));
    return () => { window.clearInterval(timer); window.clearTimeout(deadline); };
  }, [phase]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      const active = recorder.current;
      if (active && active.state !== "inactive") {
        active.onstop = null;
        active.onerror = null;
        active.ondataavailable = null;
        active.stop();
      }
      stream.current?.getTracks().forEach((track) => track.stop());
      audio.current?.pause();
      if (beepContext.current && beepContext.current.state !== "closed") void beepContext.current.close().catch(() => {});
      beepContext.current = null;
    };
  }, []);

  const stopTracks = () => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  };

  const startRecording = async () => {
    setError("");
    setOversize(false);
    setElapsedMs(0);
    setDurationMs(0);
    setPhase("starting");
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setError("Microphone needs a secure HTTPS invitation. Please open the secure link and try again.");
      setPhase("idle");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Audio recording isn’t supported here. Please open the invitation in Safari or Chrome.");
      setPhase("idle");
      return;
    }
    let cueContext: AudioContext | null = null;
    try {
      // Prime Web Audio directly from the user's tap, before the asynchronous mic prompt.
      if (typeof window.AudioContext === "function") {
        cueContext = new window.AudioContext();
        beepContext.current = cueContext;
        void cueContext.resume().catch(() => {});
      }
      const liveStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      if (!alive.current) {
        liveStream.getTracks().forEach((track) => track.stop());
        if (cueContext && cueContext.state !== "closed") void cueContext.close().catch(() => {});
        return;
      }
      stream.current = liveStream;
      chunks.current = [];
      const choices = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"];
      const mimeType = choices.find((type) => MediaRecorder.isTypeSupported(type));
      const recorderOptions: MediaRecorderOptions = { audioBitsPerSecond: 48_000 };
      if (mimeType) recorderOptions.mimeType = mimeType;
      const liveRecorder = new MediaRecorder(liveStream, recorderOptions);
      recorder.current = liveRecorder;
      liveRecorder.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      liveRecorder.onerror = () => {
        stopTracks();
        setError("The recording stopped unexpectedly. Please try again.");
        setPhase("idle");
      };
      liveRecorder.onstop = () => {
        const elapsed = Math.min(MAX_RECORDING_MS, Math.max(0, Date.now() - startedAt.current));
        const type = liveRecorder.mimeType || chunks.current[0]?.type || "audio/webm";
        const recording = new Blob(chunks.current, { type });
        stopTracks();
        setElapsedMs(elapsed);
        setDurationMs(elapsed);
        if (elapsed < 500) {
          setError("That was a very short note. Please record for at least half a second and try again.");
          setPhase("idle");
          return;
        }
        if (!recording.size) {
          setError("We didn’t catch any audio. Please check your microphone and record again.");
          setPhase("idle");
          return;
        }
        setClip(recording);
        setClipUrl(URL.createObjectURL(recording));
        setPlayheadMs(0);
        setPhase("review");
      };
      liveRecorder.start(250);
      startedAt.current = Date.now();
      setPhase("recording");
      playStartBeep(cueContext);
    } catch (cause) {
      stopTracks();
      if (cueContext && cueContext.state !== "closed") void cueContext.close().catch(() => {});
      if (beepContext.current === cueContext) beepContext.current = null;
      if (!alive.current) return;
      setError(microphoneMessage(cause));
      setPhase("idle");
    }
  };

  const stopRecording = () => {
    const active = recorder.current;
    if (active?.state === "recording") {
      setPhase("processing");
      active.stop();
    }
  };

  const deleteAndRerecord = () => {
    audio.current?.pause();
    if (audio.current) audio.current.currentTime = 0;
    setPlaying(false);
    setPlayheadMs(0);
    setClip(null);
    setClipUrl("");
    setDurationMs(0);
    setElapsedMs(0);
    setError("");
    setOversize(false);
    setPhase("idle");
  };

  const submit = async () => {
    if (!clip || !code) return;
    setError("");
    setPhase("uploading");
    if (clip.size > MAX_UPLOAD_BYTES) {
      setOversize(true);
      setError("This recording is too large. Please record again in a quiet place.");
      setPhase("review");
      return;
    }
    if (code.trim().toUpperCase() === DEMO_CODE) {
      setPhase("demo");
      return;
    }
    try {
      const form = new FormData();
      form.append("code", code);
      form.append("durationMs", String(Math.min(MAX_RECORDING_MS, Math.round(durationMs))));
      form.append("file", clip, "voice-note");
      const response = await fetch("/api/guestbook", { method: "POST", body: form });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "We couldn’t send your note just now. Please try again.");
      setPhase("sent");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn’t send your note just now. Please try again.");
      setPhase("review");
    }
  };

  const togglePlayback = async () => {
    const player = audio.current;
    if (!player) return;
    if (!player.paused) { player.pause(); return; }
    if (player.ended) player.currentTime = 0;
    try { await player.play(); }
    catch { setError("Playback isn’t available in this browser. Please try again."); }
  };

  const isRecording = phase === "recording";
  const showReview = phase === "review" || phase === "uploading" || phase === "sent" || phase === "demo";
  const recordedTooLarge = oversize || (clip?.size ?? 0) > MAX_UPLOAD_BYTES;
  const ringing = canRecord && phase === "idle" && inView && !reduceMotion;

  return (
    <section ref={sectionRef} id="voice-guestbook" className="sec-sm" aria-labelledby="voice-guestbook-title">
      <div className="col-wide">
        <div className="mb-5 text-center sm:mb-7">
          <p className="inline-flex items-center gap-2 rounded-full bg-wine px-4 py-2 font-sans text-[10px] font-semibold uppercase tracking-[.22em] text-lace shadow-[0_6px_18px_-8px_rgba(110,31,46,.8)] sm:text-xs">
            <span aria-hidden="true" className="text-sm">♡</span> Voice guestbook · anonymous
          </p>
          <h2 id="voice-guestbook-title" className="script mx-auto mt-3 text-[clamp(2.5rem,9vw,4.8rem)] leading-none text-wine text-balance">Leave a little love</h2>
          <p className="mx-auto mt-3 max-w-xl font-serif text-base italic text-mocha text-balance sm:text-lg">Send us your wishes, greetings, or your prayers for us anonymously with a voice note.</p>
        </div>
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] border-2 border-wine/20 bg-[#F8F2E7]/95 shadow-[0_20px_54px_rgba(69,50,35,.18)]">
          <div aria-hidden="true" className="absolute inset-0 opacity-[.3]" style={{ backgroundImage: "radial-gradient(ellipse at 8% 12%,rgba(110,31,46,.19),transparent 38%),radial-gradient(ellipse at 92% 100%,rgba(166,137,107,.27),transparent 42%)" }} />
          <div aria-hidden="true" className="absolute inset-x-5 top-3 border-t border-dashed border-[#A6896B]/50 md:inset-x-8 md:top-4" />
          <span aria-hidden="true" className="absolute right-7 top-7 rotate-12 font-serif text-3xl text-wine/20">♡</span>
          <span aria-hidden="true" className="absolute bottom-12 left-7 -rotate-12 font-serif text-2xl text-[#A6896B]/35">✦</span>

          <div className="relative px-4 pb-8 pt-7 sm:px-8 sm:pb-10 sm:pt-8">
            <div className="relative mx-auto flex h-56 w-full max-w-md items-center justify-center sm:h-72">
              <motion.span aria-hidden="true" className="absolute left-5 top-6 z-[2] font-serif text-3xl text-wine/80 sm:left-14 sm:top-8 sm:text-4xl" animate={reduceMotion || !inView ? undefined : { y: [0, -7, 0], rotate: [-9, 5, -9] }} transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}>♡</motion.span>
              <motion.span aria-hidden="true" className="absolute bottom-6 left-7 z-[2] font-serif text-2xl text-wine/70 sm:bottom-10 sm:left-16 sm:text-3xl" animate={reduceMotion || !inView ? undefined : { y: [0, 5, 0], rotate: [4, -7, 4] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: .4 }}>♫</motion.span>
              <motion.div aria-hidden="true" animate={reduceMotion || !inView ? undefined : { y: [0, -3, 0], rotate: [7, 4, 7] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }} className="absolute left-1/2 top-3 z-[2] -translate-x-1/2 rounded-sm border border-[#B99D7D]/45 bg-[#EFE3D4] px-2 py-1 shadow-[0_3px_8px_rgba(61,47,38,.16)] sm:top-5 sm:px-3 sm:py-2">
                <span className="script whitespace-nowrap text-[clamp(.68rem,3.4vw,.95rem)] text-wine">leave a message after the beep</span>
              </motion.div>
              {canRecord ? (
                <motion.button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={phase === "starting" || phase === "processing"}
                  aria-label={isRecording ? `Tap to stop recording at ${clock(elapsedMs)}` : "Tap the phone to start recording"}
                  whileTap={reduceMotion ? undefined : { scale: 0.94 }}
                  className={`relative z-[1] grid h-40 w-40 place-items-center rounded-full border border-[#B99D7D]/75 bg-[#FCFAF5] text-wine shadow-[0_12px_30px_rgba(72,35,33,.22)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-wine disabled:cursor-wait sm:h-52 sm:w-52 ${isRecording ? "bg-[#F4E8E0]" : "hover:bg-[#F1E6D8]"}`}
                >
                  {ringing && <>
                    <motion.span aria-hidden="true" className="absolute -left-2 top-1/3 h-10 w-4 rounded-l-full border-y-2 border-l-2 border-wine/45" animate={{ opacity: [0, .8, 0], x: [2, -4, -7] }} transition={{ duration: 1, repeat: Infinity, repeatDelay: 1.55, ease: "easeInOut" }} />
                    <motion.span aria-hidden="true" className="absolute -right-2 top-1/3 h-10 w-4 rounded-r-full border-y-2 border-r-2 border-wine/45" animate={{ opacity: [0, .8, 0], x: [-2, 4, 7] }} transition={{ duration: 1, repeat: Infinity, repeatDelay: 1.55, ease: "easeInOut" }} />
                  </>}
                  <motion.span
                    className="relative z-[1] h-36 w-36 sm:h-48 sm:w-48"
                    animate={ringing ? { rotate: [0, -5, 5, -4, 4, 0] } : undefined}
                    transition={{ duration: .65, repeat: ringing ? Infinity : 0, repeatDelay: 1.7, ease: "easeInOut" }}
                    style={{ transformOrigin: "50% 78%" }}
                  >
                    <RotaryPhone className="h-full w-full drop-shadow-[0_3px_2px_rgba(61,47,38,.15)]" />
                  </motion.span>
                  <span className="absolute -bottom-2 rounded-full bg-[#EFE3D4] px-4 py-1.5 font-sans text-[10px] uppercase tracking-[.18em] text-mocha shadow-sm sm:px-5 sm:text-[11px]">
                    {isRecording ? "hang up" : phase === "starting" ? "connecting" : phase === "processing" ? "one moment" : "pick up"}
                  </span>
                </motion.button>
              ) : (
                <div className="relative z-[1] grid h-40 w-40 place-items-center rounded-full border border-[#B99D7D]/65 bg-[#FCFAF5] text-wine shadow-[0_12px_30px_rgba(72,35,33,.18)] sm:h-52 sm:w-52">
                  <RotaryPhone className="h-36 w-36 sm:h-48 sm:w-48" />
                  <span aria-hidden="true" className="absolute -bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-[#F8F2E7] bg-wine text-xs text-white">✦</span>
                </div>
              )}
            </div>
            <p className="mt-2 text-center font-serif text-base leading-relaxed text-mocha sm:text-lg">Tap the phone to leave it in your own voice.</p>

            {canRecord ? (
              <>
                {(phase === "idle" || phase === "starting") && (
                  <div className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-8 sm:gap-3">
                    {PROMPTS.map((text, index) => (
                      <motion.div
                        key={text}
                        initial={reduceMotion ? false : { opacity: 0, y: 8, x: index % 2 ? 5 : -5 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        transition={{ duration: .38, delay: index * .09, ease: "easeOut" }}
                        className="relative flex min-h-12 items-center gap-2 rounded-2xl border border-[#B99D7D]/30 bg-[#FCF8F1] px-3 py-2.5 text-[12px] leading-snug text-mocha shadow-[0_3px_9px_rgba(72,35,33,.06)] after:absolute after:-bottom-1.5 after:left-5 after:h-3 after:w-3 after:rotate-45 after:border-b after:border-r after:border-[#B99D7D]/30 after:bg-[#FCF8F1] sm:min-h-14 sm:px-4 sm:text-sm"
                      >
                        <span aria-hidden="true" className="relative z-[1] grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#EDE0D1] font-serif text-[11px] text-wine">{index === 0 ? "♡" : index === 1 ? "✦" : index === 2 ? "20" : "♪"}</span>
                        <span className="relative z-[1] font-serif">{text}</span>
                      </motion.div>
                    ))}
                  </div>
                )}

                {isRecording && (
                  <div className="mt-6 rounded-2xl border border-wine/15 bg-[#FCF8F1] px-4 py-3 sm:mt-8 sm:px-5" role="status" aria-live="polite">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 font-serif text-sm text-wine"><motion.span aria-hidden="true" className="h-2 w-2 rounded-full bg-wine" animate={reduceMotion || !inView ? undefined : { opacity: [.35, 1, .35] }} transition={{ duration: .9, repeat: Infinity }} />On the line</span>
                      <span className="font-mono text-sm tabular-nums text-mocha">{clock(elapsedMs)} <span className="text-taupe/55">/ 00:20</span></span>
                    </div>
                    <div role="progressbar" aria-label="Recording time" aria-valuemin={0} aria-valuemax={20} aria-valuenow={Math.min(20, Math.floor(elapsedMs / 1000))} className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#DCCDB8]">
                      <div className="h-full rounded-full bg-wine transition-[width] duration-100" style={{ width: `${Math.min(100, (elapsedMs / MAX_RECORDING_MS) * 100)}%` }} />
                    </div>
                    <p className="mt-2 font-serif text-xs italic text-taupe">Tap the phone to finish. It stops at 20 seconds.</p>
                  </div>
                )}
                {phase === "starting" && <p role="status" className="mt-3 text-center font-serif text-xs italic text-taupe">Getting the line ready…</p>}
                {phase === "processing" && <p role="status" className="mt-3 text-center font-serif text-xs italic text-taupe">Saving your little message…</p>}

                {showReview && clipUrl && (
                  <div className="mt-6 rounded-2xl border border-[#B99D7D]/30 bg-[#FCF8F1] p-3 sm:p-4">
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={togglePlayback} aria-label={playing ? "Pause recording" : "Play recording"} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-wine text-lace transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine">
                        <PlayMark playing={playing} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 font-mono text-[11px] tabular-nums text-mocha"><span>{clock(playheadMs)}</span><span>{clock(durationMs)}</span></div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#DCCDB8]"><div className="h-full rounded-full bg-wine transition-[width] duration-150" style={{ width: `${durationMs ? Math.min(100, (playheadMs / durationMs) * 100) : 0}%` }} /></div>
                      </div>
                    </div>
                    <audio ref={audio} src={clipUrl} preload="metadata" className="hidden" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={(event) => setPlayheadMs(event.currentTarget.currentTime * 1000)} onEnded={() => { setPlaying(false); setPlayheadMs(durationMs); }} />
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                      {(phase === "review" || phase === "uploading") && <>
                        <button type="button" onClick={deleteAndRerecord} disabled={phase === "uploading"} className="rounded-full border border-wine/30 px-4 py-2 font-sans text-[10px] uppercase tracking-[.13em] text-wine transition-colors hover:bg-wine/5 disabled:opacity-50">Delete &amp; redo</button>
                        <button type="button" onClick={submit} disabled={phase === "uploading" || !clip || !code || recordedTooLarge} className="rounded-full bg-wine px-5 py-2.5 font-sans text-[10px] uppercase tracking-[.13em] text-lace transition-colors hover:bg-mocha disabled:cursor-wait disabled:opacity-50">{phase === "uploading" ? "Sending…" : "Send with love"}</button>
                      </>}
                      {phase === "sent" && <p role="status" className="font-serif text-sm italic text-moss">Sent with love. Thank you.</p>}
                      {phase === "demo" && <p role="status" className="font-serif text-sm italic text-taupe">Demo only — this note wasn’t saved.</p>}
                    </div>
                  </div>
                )}

                {phase === "sent" && <button type="button" onClick={deleteAndRerecord} className="mt-2 block w-full text-center font-serif text-xs italic text-wine underline decoration-wine/30 underline-offset-4 hover:text-mocha">Leave another note</button>}
                {phase === "demo" && <button type="button" onClick={deleteAndRerecord} className="mt-2 block w-full text-center font-serif text-xs italic text-wine underline decoration-wine/30 underline-offset-4 hover:text-mocha">Try another demo</button>}
                <p className="mt-4 text-center font-serif text-[11px] italic text-taupe/80">Mic permission is requested only when you tap the phone.</p>
              </>
            ) : (
              <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-[#B99D7D]/25 bg-[#FCF8F1] px-3 py-3 text-sm text-mocha sm:mt-8">
                <span aria-hidden="true" className="text-wine">✦</span><span className="font-serif">Open your invitation to leave a voice note.</span>
              </div>
            )}

            {error && <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-wine/15 bg-wine/[.06] px-3 py-2.5 text-sm text-wine"><span className="font-serif">{error}</span>{canRecord && <div className="flex items-center gap-2">{isEmbedded && <a href={typeof window !== "undefined" ? window.location.href : "/"} target="_blank" rel="noreferrer" className="shrink-0 font-sans text-[10px] uppercase tracking-[.1em] underline underline-offset-2">Open in a tab ↗</a>}<button type="button" onClick={startRecording} className="shrink-0 rounded-full border border-wine/25 px-3 py-1.5 font-sans text-[10px] uppercase tracking-[.12em] hover:bg-wine/5">Try again</button></div>}</div>}
          </div>
          <div aria-hidden="true" className="absolute inset-x-5 bottom-3 border-t border-dashed border-[#A6896B]/45 md:inset-x-8 md:bottom-4" />
        </div>
      </div>
    </section>
  );
}
