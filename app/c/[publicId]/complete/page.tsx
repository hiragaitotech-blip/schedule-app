export default function CandidateCompletePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 py-12">
      <div className="rounded-full bg-green-100 p-6">
        <svg
          className="h-16 w-16 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-slate-900">
        ご回答ありがとうございました
      </h1>
      <p className="text-center text-slate-600">
        選択された候補日時を確認し、担当者からご連絡いたします。
      </p>
    </div>
  );
}

