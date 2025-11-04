"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { GetTelegramMe } from "@/application/telegram/usecases/GetTelegramMe";
import { GetTelegramLink } from "@/application/telegram/usecases/GetTelegramLink";
import { TelegramHttpRepo } from "@/infrastructure/telegram/TelegramHttpRepo";
import { UnlinkTelegram } from "@/application/telegram/usecases/UnlinkTelegram";

const repo = new TelegramHttpRepo();
const ucMe = new GetTelegramMe(repo);
const ucLink = new GetTelegramLink(repo);
const ucUnlink = new UnlinkTelegram(repo);

export function useTelegram(enabled = true) {
  const [state, setState] = useState<{ linked: boolean; username?: string | null }>({ linked: false });
  const [busy, setBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const result = await ucMe.execute();
      setState(result);
    } catch (error) {
      console.error('Error al obtener estado de Telegram:', error);
      // En caso de error, mantenemos el estado actual como no vinculado
      setState({ linked: false, username: null });
    }
  }, [enabled]);

  useEffect(() => { 
    if (enabled) {
      refresh(); 
    }
    
    // Cleanup function para limpiar el polling si el componente se desmonta
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [enabled, refresh]);

  const startPollingOnce = () => {
    if (pollRef.current) return;
    let elapsed = 0;
    pollRef.current = setInterval(async () => {
      elapsed += 2000;
      try {
        const me = await ucMe.execute();
        setState(me);
        if (me.linked || elapsed >= 60000) {
          clearInterval(pollRef.current!);
          pollRef.current = null;
        }
      } catch (error) {
        console.error('Error durante polling:', error);
        // Si hay error, continuamos el polling por si era temporal
        if (elapsed >= 60000) {
          clearInterval(pollRef.current!);
          pollRef.current = null;
        }
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
  
  const unlink = async () => {
    setBusy(true);
    try {
      await ucUnlink.execute();
      // Actualizar inmediatamente el estado local
      setState({ linked: false, username: null });
      // Refrescar desde el servidor para confirmar
      await refresh();
    } catch (error) {
      console.error('Error al desvincular Telegram:', error);
      // En caso de error, refrescamos para obtener el estado real
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return { state, busy, link, unlink, refresh };
}
