import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const StickyBanner = ({
  children,
  className,
  open = true,
  onClose,
  backgroundColor = "#FDE082",
}: {
  children: React.ReactNode;
  className?: string;
  open?: boolean;
  onClose?: () => void;
  backgroundColor?: string;
}) => {
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={cn(
            "fixed top-0 inset-x-0 z-[99999] flex items-center justify-between gap-2 px-3 py-1.5 shadow-xs text-xs font-sans font-medium select-none border-b border-black/10",
            className
          )}
          style={{ backgroundColor }}
        >
          <div className="flex-1 text-center truncate flex items-center justify-center">
            {children}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded transition-colors shrink-0 opacity-75 hover:opacity-100 hover:bg-black/10 cursor-pointer"
            aria-label="Close banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
