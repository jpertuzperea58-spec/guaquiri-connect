import { useEffect, useState } from "react";
import { qrDataUrl } from "../../lib/voucher.ts";

export function QrImage({ value, testId }: { value: string; testId?: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void qrDataUrl(value).then((url) => {
      if (active) {
        setSrc(url);
      }
    });
    return () => {
      active = false;
    };
  }, [value]);

  if (!src) {
    return <div className="size-44 animate-pulse bg-white/10" aria-hidden="true" />;
  }

  return (
    <img
      data-testid={testId}
      src={src}
      alt="Código QR para conectarse a la red WiFi"
      className="size-44 bg-white p-2"
    />
  );
}
