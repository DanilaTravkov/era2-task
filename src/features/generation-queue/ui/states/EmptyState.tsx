import { Inbox, SearchX } from "lucide-react";

const copy = {
  queue: ["Задач пока нет", "Когда появятся клиентские генерации, они будут показаны здесь."],
  results: ["Ничего не найдено", "Измените фильтр статуса или текст поиска."],
} as const;

export function EmptyState({ variant }: { variant: "queue" | "results" }) {
  const Icon = variant === "queue" ? Inbox : SearchX;
  const [title, text] = copy[variant];
  return (
    <div className="rounded-lg border border-dashed border-white/15 bg-[#211a16] px-5 py-12 text-center">
      <Icon className="mx-auto size-8 text-[#e85420]" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#c8bbb2]">{text}</p>
    </div>
  );
}
