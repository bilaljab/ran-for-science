"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  downloadCertificatePdf,
  downloadCertificatePng,
  type CertificateData,
} from "@/features/workshops/lib/certificate";

type Format = "pdf" | "png";

export function CertificateDownload({ data }: { data: CertificateData }) {
  const [busy, setBusy] = useState<Format | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  async function download(format: Format) {
    setBusy(format);
    setFailure(null);
    try {
      await (format === "pdf" ? downloadCertificatePdf(data) : downloadCertificatePng(data));
    } catch (error) {
      // The technical reason is shown so a failure on an unusual device can be diagnosed from a screenshot.
      setFailure(error instanceof Error ? `${error.name}: ${error.message}` : String(error));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex w-full flex-col justify-center gap-3 sm:flex-row">
        <Button size="lg" className="w-full sm:w-auto" onClick={() => download("pdf")} disabled={busy !== null}>
          <Download aria-hidden className="h-5 w-5" />
          {busy === "pdf" ? "جارٍ التجهيز..." : "تحميل الشهادة PDF"}
        </Button>
        <Button size="lg" variant="outline" className="w-full sm:w-auto" onClick={() => download("png")} disabled={busy !== null}>
          <Download aria-hidden className="h-5 w-5" />
          {busy === "png" ? "جارٍ التجهيز..." : "تحميل كصورة PNG"}
        </Button>
      </div>
      <div className="min-h-5 text-center" role="alert">
        {failure && (
          <>
            <p className="text-sm text-red-600">تعذر تجهيز الشهادة، حاول مرة أخرى.</p>
            <p className="mt-1 break-all text-xs text-primary-900/50" dir="ltr">
              {failure}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
