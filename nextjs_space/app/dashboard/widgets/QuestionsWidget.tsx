import { MessageSquare } from "lucide-react";
import Link from "next/link";

interface QuestionsData {
  unanswered: number;
  total: number;
  answered: number;
}

async function fetchQuestionsData(): Promise<QuestionsData> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard/widgets/questions`, {
    cache: "no-store"
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch questions data');
  }

  return res.json();
}

export default async function QuestionsWidget() {
  try {
    const data = await fetchQuestionsData();

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Supplier Questions</h3>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="text-3xl font-bold text-amber-600">{data.unanswered}</div>
            <div className="text-sm text-gray-600">Unanswered</div>
          </div>
          
          <div className="flex justify-between text-sm pt-3 border-t">
            <span className="text-gray-700">Total Questions</span>
            <span className="font-semibold">{data.total}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Answered</span>
            <span className="font-semibold text-green-600">{data.answered}</span>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Questions widget error:', error);
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Supplier Questions</h3>
        </div>
        <p className="text-red-600 text-sm">Failed to load data</p>
      </div>
    );
  }
}
