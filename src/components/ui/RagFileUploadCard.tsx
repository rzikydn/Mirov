import { useState, useEffect } from "react";
import { FileUploadCard, UploadedFile } from "./file-upload-card";
import InputFaqModal from "../dashboards/modals/InputFaqModal";
import {
  listRagDocuments,
  uploadRagDocument,
  addRagFAQ,
  deleteRagDocument,
  RagDocument
} from "../../services/ragKnowledgeBase";
import toast from "react-hot-toast";

interface RagFileUploadCardProps {
  darkMode?: boolean;
  className?: string;
}

const createMockFile = (name: string, size: number, type: string): File => {
  const bytes = new Uint8Array(size || 16384);
  return new File([bytes], name, { type });
};

export default function RagFileUploadCard({ darkMode, className }: RagFileUploadCardProps) {
  const [ragItems, setRagItems] = useState<RagDocument[]>([]);
  const [showFaqModal, setShowFaqModal] = useState(false);

  const fetchDocs = async () => {
    try {
      const docs = await listRagDocuments();
      setRagItems(docs);
    } catch (e) {
      console.error('Failed to fetch RAG docs in card:', e);
    }
  };

  useEffect(() => {
    fetchDocs();
    const interval = setInterval(fetchDocs, 4000);
    return () => clearInterval(interval);
  }, []);

  // Map RagDocument[] to UploadedFile[] UI format — exclude FAQ (sudah punya panel sendiri)
  const files: UploadedFile[] = ragItems
    .filter((item) => item.type !== 'FAQ')
    .map((item) => {
      let fileType = "application/pdf";
      if (item.type === "DOCX") fileType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      if (item.type === "PPTX") fileType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

      return {
        id: String(item.id),
        file: createMockFile(item.title, item.fileSize || 1024, fileType),
        progress: item.status === 'INDEXED' ? 100 : item.status === 'ERROR' ? 0 : 50,
        status: item.status === 'INDEXED' ? 'completed' : item.status === 'ERROR' ? 'failed' : 'uploading',
      };
    });

  const handleFilesChange = async (newFiles: File[]) => {
    for (const file of newFiles) {
      const toastId = toast.loading(`Mengunggah "${file.name}" ke Vector RAG...`);
      try {
        const res = await uploadRagDocument(file, 'Dokumen Upload');
        if (res.success) {
          toast.success(`Dokumen "${file.name}" berhasil diunggah & diproses!`, { id: toastId });
          await fetchDocs();
        } else {
          toast.error(`Gagal unggah: ${res.message}`, { id: toastId });
        }
      } catch (err: any) {
        toast.error(`Error: ${err.message}`, { id: toastId });
      }
    }
  };

  const handleFileRemove = async (idStr: string) => {
    const id = parseInt(idStr);
    if (isNaN(id)) return;
    const target = ragItems.find((item) => item.id === id);
    try {
      await deleteRagDocument(id);
      toast.success(`Dokumen "${target?.title || 'File'}" berhasil dihapus.`);
      await fetchDocs();
    } catch (e: any) {
      toast.error(`Gagal menghapus: ${e.message}`);
    }
  };

  const handleAddFaqSuccess = async (faq: { question: string; answer: string; category: string }) => {
    try {
      const res = await addRagFAQ(faq.question, faq.answer, faq.category);
      if (res.success) {
        toast.success(`FAQ "${faq.question}" berhasil disimpan & diindeks!`);
        await fetchDocs();
      }
    } catch (e: any) {
      toast.error(`Gagal menyimpan FAQ: ${e.message}`);
    }
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
