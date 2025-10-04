"use client"

export default function StyleGuide({ onBack }) {
  return (
    <main className="min-h-dvh bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-balance">SlashTalk Style Guide</h1>
          <button
            onClick={onBack}
            className="rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            Back
          </button>
        </div>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Colors (exactly 5)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Swatch name="Indigo 600" className="bg-indigo-600" code="#4F46E5" />
            <Swatch name="Purple 600" className="bg-purple-600" code="#7C3AED" />
            <Swatch name="Gray (bg/text)" className="bg-gray-200 dark:bg-gray-800" code="Gray scale" />
            <Swatch name="Green 500" className="bg-emerald-500" code="#10B981" />
            <Swatch name="Red 500" className="bg-red-500" code="#EF4444" />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Typography</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Modern sans-serif: system stack via Tailwind's font-sans.
          </p>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-2">
            <p className="text-2xl font-semibold">Heading - 24px / 700</p>
            <p className="text-base leading-relaxed">
              Body - 16px / leading-relaxed. Keep line-height 1.5 for readability.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Small - 14px auxiliary text.</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Spacing & Corners</h2>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>Base spacing: 4px scale (4, 6, 8, 12, 16...)</li>
              <li>Section gaps ≥ 16px; related elements within 8px.</li>
              <li>Rounded corners: components use rounded-xl / rounded-2xl.</li>
              <li>Smooth transitions on hover/focus for interactive elements.</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  )
}

function Swatch({ name, code, className }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
      <div className={`h-14 w-full rounded-lg ${className}`} aria-hidden />
      <p className="mt-2 text-sm font-medium">{name}</p>
      <p className="text-xs text-gray-600 dark:text-gray-400">{code}</p>
    </div>
  )
}
