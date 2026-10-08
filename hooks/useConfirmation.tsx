"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useLanguage } from "@/components/providers/LanguageProvider";

type ConfirmationRequest = {
  title?: string;
  description: string;
  confirmLabel?: string;
};

export function useConfirmation() {
  const { text } = useLanguage();
  const [request, setRequest] = useState<ConfirmationRequest | null>(null);
  const resolveRequest = useRef<((confirmed: boolean) => void) | null>(null);

  const confirm = useCallback((nextRequest: ConfirmationRequest) => {
    return new Promise<boolean>((resolve) => {
      resolveRequest.current = resolve;
      setRequest(nextRequest);
    });
  }, []);

  const finish = useCallback((confirmed: boolean) => {
    resolveRequest.current?.(confirmed);
    resolveRequest.current = null;
    setRequest(null);
  }, []);

  const dialog = (
    <Modal
      open={Boolean(request)}
      title={request?.title ?? "Please confirm"}
      description={request?.description}
      onClose={() => finish(false)}
    >
      <div className="flex justify-end gap-3">
        <Button onClick={() => finish(false)} type="button" variant="secondary">
          {text("Cancel")}
        </Button>
        <Button onClick={() => finish(true)} type="button">
          {text(request?.confirmLabel ?? "Confirm")}
        </Button>
      </div>
    </Modal>
  );

  return { confirm, dialog };
}
