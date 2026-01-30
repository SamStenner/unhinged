"use client";

import { PlusIcon } from "lucide-react";

interface AddPromptCardProps {
  onClick: () => void;
}

export default function AddPromptCard({ onClick }: AddPromptCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border-2 border-dashed border-[#67295F] bg-white p-4 flex items-center justify-between hover:bg-purple-50 transition-colors"
    >
      <div>
        <p className="text-[15px] font-semibold text-black text-left">
          Select a prompt
        </p>
        <p className="text-[14px] text-gray-400 italic text-left">
          And write your answer
        </p>
      </div>
      <div className="w-7 h-7 rounded-full bg-[#67295F] flex items-center justify-center shrink-0">
        <PlusIcon className="w-4 h-4 text-white" />
      </div>
    </button>
  );
}
