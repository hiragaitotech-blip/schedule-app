import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent sm:text-6xl">
          AI Interview Scheduler
        </h1>
        <p className="mt-6 text-xl font-medium text-slate-700 sm:text-2xl">
          AIを使った面接日程調整SaaS
        </p>
        <p className="mt-3 text-base text-slate-500 sm:text-lg">
          メールから自動で案件を作成し、候補者の日程調整を効率化
        </p>
        <div className="mt-10 flex justify-center">
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-8 text-sm font-semibold text-white shadow-lg transition hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl"
          >
            ログイン
          </Link>
        </div>
      </div>
    </div>
  );
}
