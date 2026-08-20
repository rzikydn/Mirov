import React, { useState, useEffect } from "react";
import { FileUploadCard, UploadedFile } from "./file-upload-card";
import InputFaqModal from "../dashboards/modals/InputFaqModal";
import {
  getRagKnowledgeBase,
  addRagItem,
  removeRagItem,
  RagKnowledgeItem
} from "../../services/ragKnowledgeBase";
import toast from "react-hot-toast";

interface RagFileUploadCardProps {
  darkMode?: boolean;
  className?: string;
}

const createMockFile = (name: string, size: number, type: string): File => {
  const blob = new Blob([""], { type });
  return new File([blob], name, { type });
};

export default function RagFileUploadCard({ darkMode, className }: RagFileUploadCardProps) {
  const [ragItems, setRagItems] = useState<RagKnowledgeItem[]>(getRagKnowledgeBase);
  const [showFaqModal, setShowFaqModal] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setRagItems(getRagKnowledgeBase());
    };
    window.addEventListener("bsmr_rag_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("bsmr_rag_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Map RagKnowledgeItem[] to UploadedFile[] UI format
  const files: UploadedFile[] = ragItems.map((item) => {
    let fileType = "application/pdf";
    if (item.type === "DOCX") fileType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (item.type === "PPTX") fileType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    if (item.type === "TXT" || item.type === "FAQ") fileType = "text/plain";

    return {
      id: item.id,
      file: createMockFile(item.title, 1.2 * 1024 * 1024, fileType),
      progress: 100,
      status: "completed",
    };
  });

  const handleFilesChange = async (newFiles: File[]) => {
    for (const file of newFiles) {
      let ext: 'PDF' | 'DOCX' | 'PPTX' | 'TXT' = 'PDF';
      if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) ext = 'DOCX';
      if (file.name.endsWith('.pptx') || file.name.endsWith('.ppt')) ext = 'PPTX';
      if (file.name.endsWith('.txt') || file.name.endsWith('.md')) ext = 'TXT';

      let extractedText = `Dokumen ${file.name} berisi panduan materi RAG resmi BSMR mengenai ${file.name.replace(/\.[^/.]+$/, "")}.`;

      // Jika file text biasa, baca teks langsung
      if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        try {
          extractedText = await file.text();
        } catch (e) {
          console.warn('Fallback reading file text:', e);
        }
      }

      const newItem: RagKnowledgeItem = {
        id: `rag-file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: file.name,
        type: ext,
        content: extractedText,
        category: "Dokumen Upload",
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        status: "Indexed",
        createdAt: new Date().toISOString(),
      };

      addRagItem(newItem);
      toast.success(`Dokumen "${file.name}" berhasil diindeks ke Vector DB AI!`);
    }
  };

  const handleFileRemove = (id: string) => {
    const target = ragItems.find((item) => item.id === id);
    removeRagItem(id);
    toast.success(`Dokumen "${target?.title || 'File'}" berhasil dihapus dari Knowledge Base.`);
  };

  const handleAddFaqSuccess = (faq: { question: string; answer: string; category: string }) => {
    const newFaqItem: RagKnowledgeItem = {
      id: `faq-${Date.now()}`,
      title: `FAQ: ${faq.question}`,
      type: "FAQ",
      question: faq.question,
      answer: faq.answer,
      content: faq.answer,
      category: faq.category,
      size: "15 KB",
      status: "Indexed",
      createdAt: new Date().toISOString(),
    };

    addRagItem(newFaqItem);
  };

  return (
    <>
      <FileUploadCard
        files={files}
        onFilesChange={handleFilesChange}
        onFileRemove={handleFileRemove}
        onInputFaq={() => setShowFaqModal(true)}
        darkMode={darkMode}
        className={className}
      />
      <InputFaqModal
        show={showFaqModal}
        darkMode={darkMode}
        onClose={() => setShowFaqModal(false)}
        onSuccess={handleAddFaqSuccess}
      />
    </>
  );
}
