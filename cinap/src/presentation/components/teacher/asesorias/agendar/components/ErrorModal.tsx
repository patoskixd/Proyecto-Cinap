"use client";

import { useEffect } from "react";
import { notify } from "@/presentation/components/shared/Toast/ToastProvider";

export function ErrorModal({ message }: { message: string | null }) {
  useEffect(() => {
    if (message) notify(message, "error");
  }, [message]);

  return null;
}
