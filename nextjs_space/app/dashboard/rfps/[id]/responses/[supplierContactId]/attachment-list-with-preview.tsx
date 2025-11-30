"use client";

import { useState } from "react";
import { Download, Eye, FileSpreadsheet, Presentation, Video, File } from "lucide-react";
import { FilePreviewModal } from "@/app/components/file-preview-modal";

interface AttachmentListWithPreviewProps {
  attachments: any[];
}

const getAttachmentIcon = (attachmentType: string) => {
  switch (attachmentType) {
    case 'PRICING_SHEET':
    case 'REQUIREMENTS_MATRIX':
      return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    case 'PRESENTATION':
      return <Presentation className="w-5 h-5 text-orange-600" />;
    case 'DEMO_RECORDING':
      return <Video className="w-5 h-5 text-purple-600" />;
    default:
      return <File className="w-5 h-5 text-gray-600" />;
  }
};

const getAttachmentTypeLabel = (attachmentType: string) => {
  const labels: Record<string, string> = {
    GENERAL: 'General',
    PRICING_SHEET: 'Pricing Sheet',
    REQUIREMENTS_MATRIX: 'Requirements Matrix',
    PRESENTATION: 'Presentation',
    DEMO_RECORDING: 'Demo Recording',
    CONTRACT_DRAFT: 'Contract Draft',
    OTHER: 'Other',
  };
  return labels[attachmentType] || attachmentType;
};

export function AttachmentListWithPreview({ attachments }: AttachmentListWithPreviewProps) {
  const [previewAttachmentId, setPreviewAttachmentId] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {attachments.map((attachment: any) => (
          <div
            key={attachment.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {getAttachmentIcon(attachment.attachmentType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {attachment.fileName}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                    {getAttachmentTypeLabel(attachment.attachmentType)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {(attachment.fileSize / 1024).toFixed(1)} KB
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Uploaded {new Date(attachment.createdAt).toLocaleDateString()}
                </p>
                {attachment.description && (
                  <p className="text-xs text-gray-600 mt-2">{attachment.description}</p>
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => setPreviewAttachmentId(attachment.id)}
                className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-700"
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </button>
              <a
                href={`/api/attachments/${attachment.id}/download`}
                download
                className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* File Preview Modal */}
      <FilePreviewModal
        attachmentId={previewAttachmentId || ""}
        isOpen={!!previewAttachmentId}
        onClose={() => setPreviewAttachmentId(null)}
      />
    </>
  );
}
