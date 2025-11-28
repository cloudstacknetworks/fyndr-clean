import { NewSupplierForm } from "./new-supplier-form";

export default function NewSupplierPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Supplier</h1>
          <p className="text-gray-600">
            Fill in the details below to create a new supplier
          </p>
        </div>
        <NewSupplierForm />
      </div>
    </div>
  );
}
