import { NewCompanyForm } from "./new-company-form";

export default function NewCompanyPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Company</h1>
          <p className="text-gray-600">
            Fill in the details below to create a new company
          </p>
        </div>
        <NewCompanyForm />
      </div>
    </div>
  );
}
