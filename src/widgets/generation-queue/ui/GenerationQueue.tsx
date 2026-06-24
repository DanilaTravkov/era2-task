import { generationTaskSeed } from "@/entities/generation-task";

const statusLabel = {
  queued: "В очереди",
  running: "Идёт",
  done: "Готово",
  failed: "Ошибка",
  canceled: "Отменено",
} as const;

const typeLabel = {
  text: "Текст",
  image: "Изображение",
  video: "Видео",
  audio: "Аудио",
} as const;

export function GenerationQueue() {
  return (
    <section className="min-h-screen bg-[#17120f] px-4 py-8 text-[#f6f0eb] sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#e85420]">ERA2</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Очередь генераций</h1>
          <p className="max-w-2xl text-sm leading-6 text-[#c8bbb2] sm:text-base">
            Следите за текстовыми, графическими, видео- и аудиозадачами в едином списке.
          </p>
        </header>

        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm text-[#c8bbb2]">
            Сейчас в списке {generationTaskSeed.length} задач: две выполняются, несколько ожидают, есть готовые и
            задача с ошибкой.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-white/10 bg-[#211a16]">
          <ul className="divide-y divide-white/10">
            {generationTaskSeed.map((task) => (
              <li key={task.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#c8bbb2]">
                    <span>{typeLabel[task.type]}</span>
                    <span aria-hidden="true">·</span>
                    <span>{task.model}</span>
                  </div>
                  <p className="mt-2 truncate text-sm font-medium text-[#f6f0eb]">{task.prompt}</p>
                </div>

                <span className="w-fit rounded-full border border-white/10 px-3 py-1 text-xs text-[#f6f0eb]">
                  {statusLabel[task.status]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
