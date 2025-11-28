"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";

interface DeleteSupplierButtonProps {
  supplierId: string;
  supplierName: string;
  hasRFPs: boolean;
  rfpCount: number;
}

export function DeleteSupplierButton({
  supplierId,
  supplierName,
  hasRFPs,
  rfpCount,
}: DeleteSupplierButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setError("");
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/suppliers/${supplierId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete supplier");
      }

      // Success! Redirect to suppliers list
      router.push("/dashboard/suppliers");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete supplier");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Delete Supplier
                </h3>
                {hasRFPs ? (
                  <>
                    <p className="text-gray-700 mb-2">
                      Cannot delete <span className="font-semibold">{supplierName}</span>
                    </p>
                    <p className="text-gray-600">
                      This supplier has <span className="font-semibold">{rfpCount}</span> associated RFP{rfpCount !== 1 ? "s" : ""}. Please delete or reassign the RFP{rfpCount !== 1 ? "s" : ""} before deleting this supplier.
                    </p>
                  </>
                ) : (
                  <p className="text-gray-700">
                    Are you sure you want to delete{" "}
                    <span className="font-semibold">{supplierName}</span>? This action
                    cannot be undone.
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  setError("");
                }}
                disabled={isDeleting}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hasRFPs ? "Close" : "Cancel"}
              </button>
              {!hasRFPs && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Supplier"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
