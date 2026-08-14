"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type BackgroundMusicProps = {
  src: string;
  title: string;
  volume: number;
};

export function BackgroundMusic({ src, title, volume }: BackgroundMusicProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const userPausedRef = useRef(false);
  const [playing, setPlaying] = useState(false);

  const startPlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || userPausedRef.current) return false;

    audio.volume = volume;
    try {
      await audio.play();
      return true;
    } catch {
      return false;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);

    const removeUnlockListeners = () => {
      document.removeEventListener("pointerdown", handleFirstInteraction, true);
      document.removeEventListener("keydown", handleFirstInteraction, true);
    };

    const handleFirstInteraction = (event: Event) => {
      const target = event.target;
      if (target instanceof Element && target.closest(".music-control")) return;
      void startPlayback().then((started) => {
        if (started) removeUnlockListeners();
      });
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    void startPlayback().then((started) => {
      if (started) return;
      document.addEventListener("pointerdown", handleFirstInteraction, true);
      document.addEventListener("keydown", handleFirstInteraction, true);
    });

    return () => {
      removeUnlockListeners();
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [startPlayback, volume]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      userPausedRef.current = false;
      void startPlayback();
      return;
    }

    userPausedRef.current = true;
    audio.pause();
  };

  return (
    <>
      <audio ref={audioRef} src={src} autoPlay loop preload="auto" aria-hidden="true" />
      <button
        className="music-control"
        type="button"
        data-playing={playing}
        aria-label={playing ? `暂停背景音乐《${title}》` : `播放背景音乐《${title}》`}
        aria-pressed={playing}
        onClick={togglePlayback}
      >
        <span className="music-bars" aria-hidden="true"><i /><i /><i /></span>
        <span className="music-label">声音&nbsp;{playing ? "开" : "关"}</span>
      </button>
    </>
  );
}
