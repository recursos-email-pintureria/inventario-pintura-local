import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PrintPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

export function PrintPreviewDialog({
  open,
  onOpenChange,
  title,
  children,
}: PrintPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div id="printable-area" className="max-h-[80vh] overflow-y-auto">
          {children}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="default"
            className="bg-amber-500 text-white hover:bg-amber-600"
            onClick={() => window.print()}
          >
            Imprimir / Guardar como PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
