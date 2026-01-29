interface PromptCardProps {
  prompt: string;
  answer: string;
}

export default function PromptCard({ prompt, answer }: PromptCardProps) {
  return (
    <div className="mx-4 my-3 bg-white rounded-2xl overflow-hidden">
      <div className="p-6">
        <p className="text-[14px] font-medium text-black mb-3"
          style={{ fontFamily: "'Tiempos Text', Georgia, serif" }}>
          {prompt}
        </p>
        <p
          className="text-[28px] leading-[1.2] text-black font-semibold tracking-tight"
          style={{ fontFamily: "'Tiempos Text', Georgia, serif" }}
        >
          {answer}
        </p>
      </div>
    </div>
  );
}
