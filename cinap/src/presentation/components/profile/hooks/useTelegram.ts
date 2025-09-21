"use client";
import { useEffect, useRef, useState } from "react";
import { GetTelegramMe } from "@/application/telegram/usecases/GetTelegramMe";
import { GetTelegramLink } from "@/application/telegram/usecases/GetTelegramLink";
import { TelegramHttpRepo } from "@/infrastructure/telegram/TelegramHttpRepo";

const repo = new TelegramHttpRepo();
const ucMe = new GetTelegramMe(repo);
const ucLink = new GetTelegramLink(repo);

export function useTelegram() {
  const [state, setState] = useState<{ linked: boolean; username?: string | null }>({ linked: false });
  const [busy, setBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = async () => setState(await ucMe.execute());

  useEffect(() => { refresh(); }, []);

  const startPollingOnce = () => {
    if (pollRef.current) return;
    let elapsed = 0;
    pollRef.current = setInterval(async () => {
      elapsed += 2000;
      const me = await ucMe.execute();
      setState(me);
      if (me.linked || elapsed >= 60000) {
        clearInterval(pollRef.current!);
        pollRef.current = null;
      }
    }, 2000);
  };

  const link = async () => {
    setBusy(true);
    try {
      const { url } = await ucLink.execute();
      window.open(url, "_blank");
      startPollingOnce();
    } finally {
      setBusy(false);
    }
  };

  return { state, busy, link, refresh };
}
