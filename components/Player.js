"use client";
import { useEffect, useRef, useState } from "react";

function parse(url) {
  try {
    const u = new URL(url);
    const h = u.hostname;
    if (/(^|\.)youtube\.com$/.test(h) || h === "youtu.be") {
      const id = h === "youtu.be" ? u.pathname.slice(1) : u.searchParams.get("v") || u.pathname.split("/").pop();
      return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` };
    }
    if (h.endsWith("vimeo.com") && !h.startsWith("player.")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return { kind: "iframe", src: `https://player.vimeo.com/video/${id}` };
    }
    if (h.startsWith("player.") || u.pathname.includes("/embed/")) return { kind: "iframe", src: url };
    if (u.pathname.endsWith(".m3u8")) return { kind: "hls", src: url };
  } catch {}
  return { kind: "file", src: url };
}

export default function Player({ url, code }) {
  const p = parse(url);
  const ref = useRef(null);
  const [pos, setPos] = useState({ top: 10, left: 10 });

  // علامة مائية بكود الطالب بتتحرك عشان تصعّب مشاركة تسجيل الشاشة
  useEffect(() => {
    const t = setInterval(() => setPos({ top: 8 + Math.random() * 70, left: 6 + Math.random() * 60 }), 9000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (p.kind !== "hls" || !ref.current) return;
    const v = ref.current;
    if (v.canPlayType("application/vnd.apple.mpegurl")) {
      v.src = p.src;
      return;
    }
    let hls;
    import("hls.js").then(({ default: Hls }) => {
      if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(p.src);
        hls.attachMedia(v);
      }
    });
    return () => hls && hls.destroy();
  }, [p.kind, p.src]);

  return (
    <div className="video-wrap" onContextMenu={(e) => e.preventDefault()}>
      {p.kind === "iframe" ? (
        <iframe src={p.src} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen />
      ) : (
        <video ref={ref} controls playsInline controlsList="nodownload" src={p.kind === "file" ? p.src : undefined} />
      )}
      <span className="wm" style={{ top: pos.top + "%", left: pos.left + "%" }}>{code}</span>
    </div>
  );
}
