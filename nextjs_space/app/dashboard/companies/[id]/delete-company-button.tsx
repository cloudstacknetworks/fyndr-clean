"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

type DeleteCompanyButtonProps = {
  companyId: string;
  companyName: string;
  hasRFPs: boolean;
  rfpCount: number;
};

export function DeleteCompanyButton({ 
  companyId, 
  companyName, 
  hasRFPs,
  rfpCount 
}: DeleteCompanyButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setError("");
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete company");
      }

      // Success! Redirect to companies list
      router.push("/dashboard/companies");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete company");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Delete Company
            </h3>
            
            {hasRFPs ? (
              <>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 font-semibold mb-2">
                    Cannot delete this company
                  </p>
                  <p className="text-red-700 text-sm">
                    This company has {rfpCount} associated RFP{rfpCount !== 1 ? "s" : ""}. 
                    Please delete or reassign the RFPs first before deleting the company.
                  </p>
                </div>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold transition-all"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete <strong>{companyName}</strong>? 
                  This action cannot be undone.
                </p>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={isDeleting}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
