"use client";

import { useState, useEffect } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import ReactMarkdown from "react-markdown";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface FilePreviewModalProps {
  attachmentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FilePreviewModal({
  attachmentId,
  isOpen,
  onClose
}: FilePreviewModalProps) {
  const [metadata, setMetadata] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && attachmentId) {
      fetchMetadata();
    }
  }, [isOpen, attachmentId]);

  const fetchMetadata = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/attachments/${attachmentId}/meta`);
      if (!res.ok) throw new Error("Failed to fetch metadata");
      const data = await res.json();
      setMetadata(data);
    } catch (err) {
      setError("Failed to load file preview");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    window.open(`/api/attachments/${attachmentId}/download`, "_blank");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">{metadata?.fileName || "Loading..."}</h2>
            {metadata && (
              <p className="text-sm text-gray-500">
                {formatFileSize(metadata.fileSize)} • {metadata.fileType}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          )}

          {error && (
            <div className="text-center text-red-600 p-8">
              {error}
            </div>
          )}

          {metadata && !isLoading && !error && (
            <FileViewer
              attachmentId={attachmentId}
              metadata={metadata}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Download className="h-4 w-4" />
            Download Original
          </button>
        </div>
      </div>
    </div>
  );
}

function FileViewer({ attachmentId, metadata }: any) {
  const { safePreviewType } = metadata;

  switch (safePreviewType) {
    case "pdf":
      return <PDFViewer attachmentId={attachmentId} />;
    case "word":
      return <WordViewer attachmentId={attachmentId} />;
    case "excel":
    case "csv":
      return <SpreadsheetViewer attachmentId={attachmentId} />;
    case "ppt":
      return <PowerPointViewer attachmentId={attachmentId} />;
    case "image":
      return <ImageViewer attachmentId={attachmentId} />;
    case "video":
      return <VideoViewer attachmentId={attachmentId} />;
    case "text":
      return <TextViewer attachmentId={attachmentId} />;
    case "markdown":
      return <MarkdownViewer attachmentId={attachmentId} />;
    default:
      return <UnsupportedViewer />;
  }
}

// Individual viewer components
function PDFViewer({ attachmentId }: { attachmentId: string }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);

  return (
    <div className="pdf-viewer flex flex-col items-center">
      <div className="mb-4 flex items-center gap-4">
        <button
          onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
          disabled={pageNumber <= 1}
          className="px-3 py-1 bg-indigo-600 text-white rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm">Page {pageNumber} of {numPages}</span>
        <button
          onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
          disabled={pageNumber >= numPages}
          className="px-3 py-1 bg-indigo-600 text-white rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <Document
        file={`/api/attachments/${attachmentId}/download`}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
      >
        <Page pageNumber={pageNumber} />
      </Document>
    </div>
  );
}

function WordViewer({ attachmentId }: { attachmentId: string }) {
  const [html, setHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchText();
  }, [attachmentId]);

  const fetchText = async () => {
    try {
      const res = await fetch(`/api/attachments/${attachmentId}/text`);
      const data = await res.json();
      setHtml(data.html || "");
    } catch (err) {
      console.error("Failed to load Word document");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div
      className="prose max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function SpreadsheetViewer({ attachmentId }: { attachmentId: string }) {
  const [sheets, setSheets] = useState<any[]>([]);
  const [selectedSheet, setSelectedSheet] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSheets();
  }, [attachmentId]);

  const fetchSheets = async () => {
    try {
      const res = await fetch(`/api/attachments/${attachmentId}/text`);
      const data = await res.json();
      setSheets(data.sheets || []);
    } catch (err) {
      console.error("Failed to load spreadsheet");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  const currentSheet = sheets[selectedSheet];

  return (
    <div>
      {sheets.length > 1 && (
        <div className="mb-4">
          <select
            value={selectedSheet}
            onChange={(e) => setSelectedSheet(Number(e.target.value))}
            className="border rounded px-3 py-2"
          >
            {sheets.map((sheet, idx) => (
              <option key={idx} value={idx}>
                {sheet.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {currentSheet && (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                {currentSheet.rows[0]?.map((cell: any, idx: number) => (
                  <th key={idx} className="border px-4 py-2 font-semibold">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentSheet.rows.slice(1, 101).map((row: any, rowIdx: number) => (
                <tr key={rowIdx}>
                  {row.map((cell: any, cellIdx: number) => (
                    <td key={cellIdx} className="border px-4 py-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PowerPointViewer({ attachmentId }: { attachmentId: string }) {
  const [slides, setSlides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSlides();
  }, [attachmentId]);

  const fetchSlides = async () => {
    try {
      const res = await fetch(`/api/attachments/${attachmentId}/text`);
      const data = await res.json();
      setSlides(data.slides || []);
    } catch (err) {
      console.error("Failed to load PowerPoint");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {slides.map((slide, idx) => (
        <div key={idx} className="border rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-2">Slide {idx + 1}</div>
          <h3 className="text-lg font-semibold mb-2">{slide.title}</h3>
          <ul className="list-disc list-inside space-y-1">
            {slide.bullets?.map((bullet: string, bIdx: number) => (
              <li key={bIdx}>{bullet}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ImageViewer({ attachmentId }: { attachmentId: string }) {
  return (
    <div className="flex justify-center">
      <img
        src={`/api/attachments/${attachmentId}/download`}
        alt="Preview"
        className="max-w-full h-auto"
      />
    </div>
  );
}

function VideoViewer({ attachmentId }: { attachmentId: string }) {
  return (
    <div className="flex justify-center">
      <video
        controls
        className="max-w-full h-auto"
        src={`/api/attachments/${attachmentId}/download`}
      />
    </div>
  );
}

function TextViewer({ attachmentId }: { attachmentId: string }) {
  const [text, setText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchText();
  }, [attachmentId]);

  const fetchText = async () => {
    try {
      const res = await fetch(`/api/attachments/${attachmentId}/text`);
      const data = await res.json();
      setText(data.text || "");
    } catch (err) {
      console.error("Failed to load text");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return <pre className="whitespace-pre-wrap font-mono text-sm">{text}</pre>;
}

function MarkdownViewer({ attachmentId }: { attachmentId: string }) {
  const [markdown, setMarkdown] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMarkdown();
  }, [attachmentId]);

  const fetchMarkdown = async () => {
    try {
      const res = await fetch(`/api/attachments/${attachmentId}/text`);
      const data = await res.json();
      setMarkdown(data.markdown || "");
    } catch (err) {
      console.error("Failed to load markdown");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="prose max-w-none">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}

function UnsupportedViewer() {
  return (
    <div className="text-center p-8">
      <p className="text-gray-600">
        This file type cannot be previewed inline. Use the button below to download the original file.
      </p>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
