"use client";

import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PdfExportButtonProps {
  href: string;
  label?: string;
  className?: string;
}

export function PdfExportButton({
  href,
  label = "Export PDF",
  className,
}: PdfExportButtonProps) {
  function handleClick() {
    window.open(href, "_blank");
  }

  return (
    <Button variant="outline" onClick={handleClick} className={className}>
      <FileText className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
