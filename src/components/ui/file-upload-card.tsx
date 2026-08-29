import * as React from "react";
import { UploadCloud, X, CheckCircle2, Trash2, FileText, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Progress } from "./progress";

export interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "completed" | "error";
}

interface FileUploadCardProps extends React.HTMLAttributes<HTMLDivElement> {
  files: UploadedFile[];
  onFilesChange: (files: File[]) => void;
  onFileRemove: (id: string) => void;
  onClose?: () => void;
  onInputFaq?: () => void;
  darkMode?: boolean;
}

export const FileUploadCard = React.forwardRef<HTMLDivElement, FileUploadCardProps>(
  ({ className, files = [], onFilesChange, onFileRemove, onClose, onInputFaq, darkMode, ...props }, ref) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles && droppedFiles.length > 0) {
        onFilesChange(droppedFiles);
      }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      if (selectedFiles.length > 0) {
        onFilesChange(selectedFiles);
      }
    };

    const triggerFileSelect = () => fileInputRef.current?.click();

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return "0 KB";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };
    
    const cardVariants = {
      hidden: { opacity: 0, y: 15 },
      visible: { opacity: 1, y: 0 },
    };
    
    const fileItemVariants = {
      hidden: { opacity: 0, x: -15 },
      visible: { opacity: 1, x: 0 },
    };

    const getFileExtLabel = (fileName: string) => {
      const ext = fileName.split('.').pop()?.toUpperCase();
      if (!ext) return "DOC";
      return ext.substring(0, 4);
    };

    return (
      <motion.div
        ref={ref}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.3 }}
        className={cn(
          "w-full h-full min-h-[460px] flex flex-col justify-start rounded-xl border p-5 shadow-xs transition-colors overflow-hidden",
          darkMode ? "bg-gray-800/80 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900",
          className
        )}
        {...props}
      >
        <div className="flex flex-col space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 flex items-center justify-center rounded-full shrink-0",
                darkMode ? "bg-blue-950/60 text-blue-400" : "bg-blue-50 text-blue-600"
              )}>
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold tracking-tight uppercase whitespace-nowrap">UPLOAD MATERI RAG KNOWLEDGE</h3>
                <p className={cn("text-xs mt-0.5 whitespace-nowrap", darkMode ? "text-gray-400" : "text-gray-500")}>
                  Unggah PDF, Word, atau PPT untuk melatih AI
                </p>
              </div>
            </div>
            {onClose && (
               <Button variant="ghost" size="icon" className="rounded-full w-7 h-7" onClick={onClose}>
                 <X className="w-3.5 h-3.5" />
               </Button>
            )}
          </div>

          {/* Dropzone Box */}
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            className={cn(
              "border-2 border-dashed rounded-lg p-3.5 flex flex-col items-center justify-center text-center transition-colors duration-200 cursor-pointer",
              isDragging
                ? darkMode ? "border-blue-500 bg-blue-950/40" : "border-blue-500 bg-blue-50/50"
                : darkMode ? "border-gray-700 hover:border-gray-600 bg-gray-900/40" : "border-gray-300 hover:border-blue-400 bg-gray-50/40"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
              className="hidden"
              onChange={handleFileSelect}
            />
            <FileText className={cn("w-6 h-6 mb-1", darkMode ? "text-gray-400" : "text-gray-500")} />
            <p className="text-xs font-semibold">Pilih file atau drag & drop ke sini</p>
            <p className={cn("text-[11px] mt-0.5", darkMode ? "text-gray-400" : "text-gray-500")}>
              Mendukung PDF, Word (.docx), PPT (.pptx) hingga 50 MB
            </p>
            <Button variant="outline" size="sm" className="mt-2 text-xs h-6.5 px-3 pointer-events-none">
              Cari Dokumen
            </Button>
          </div>

          {/* + Input FAQ Cepat Button */}
          <Button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onInputFaq) onInputFaq();
            }}
            className="w-full mt-2 h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Input FAQ Cepat
          </Button>
        </div>
        
        {/* Uploaded Files List */}
        {files.length > 0 && (
          <div className={cn("mt-4 pt-3 border-t space-y-2 flex-1 overflow-y-auto pr-1", darkMode ? "border-gray-700" : "border-gray-200")}>
            <p className={cn("text-[10px] font-bold uppercase tracking-wider", darkMode ? "text-gray-400" : "text-gray-400")}>
              Dokumen Tersimpan ({files.length})
            </p>
            <ul className="space-y-2">
              <AnimatePresence>
                {files.map((file) => (
                  <motion.li
                    key={file.id}
                    variants={fileItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    layout
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className={cn(
                        "w-8 h-8 flex items-center justify-center rounded text-[10px] font-extrabold shrink-0",
                        darkMode ? "bg-gray-700 text-blue-400" : "bg-blue-100 text-blue-700"
                      )}>
                        {getFileExtLabel(file.file.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{file.file.name}</p>
                        <div className={cn("text-[10px] flex items-center gap-1 mt-0.5", darkMode ? "text-gray-400" : "text-gray-500")}>
                          {file.status === "uploading" && (
                            <span>{formatFileSize((file.file.size * file.progress) / 100)} / {formatFileSize(file.file.size)}</span>
                          )}
                          {file.status === "completed" && (
                            <span>{formatFileSize(file.file.size)}</span>
                          )}
                          <span>•</span>
                          <span className={cn(
                            file.status === 'uploading' ? "text-blue-500 font-semibold" : "text-emerald-500 font-semibold"
                          )}>
                            {file.status === 'uploading' ? `Mengunggah (${file.progress}%)` : 'Tersimpan ke Vector DB'}
                          </span>
                        </div>
                        {file.status === 'uploading' && <Progress value={file.progress} className="h-1 mt-1" />}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      {file.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      <Button variant="ghost" size="icon" className="rounded-full w-6 h-6 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40" onClick={() => onFileRemove(file.id)}>
                        {file.status === 'completed' ? <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" /> : <X className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        )}
      </motion.div>
    );
  }
);
FileUploadCard.displayName = "FileUploadCard";
