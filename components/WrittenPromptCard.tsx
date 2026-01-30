"use client";

import { useState } from "react";
import { Button } from "./ui/button";

interface WrittenPromptCardProps {
  prompt: string;
  answer: string;
  onRemove: () => void;
  onAnswerChange: (newAnswer: string) => void;
}

export default function WrittenPromptCard({
  prompt,
  answer,
  onRemove,
  onAnswerChange,
}: WrittenPromptCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(answer);

  const handleSave = () => {
    onAnswerChange(editValue);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-xl relative">
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-3 right-1 w-6 h-6 flex items-center justify-center"
        aria-label="Remove prompt"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#999"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <p className="text-[15px] font-semibold text-black pr-6 mb-1">{prompt}</p>
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full text-[14px] text-gray-700 leading-snug border border-gray-300 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#67295F] focus:border-transparent"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditValue(answer);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-[#67295F] hover:bg-[#5a2352]"
            >
              Save
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-left w-full"
        >
          <p className="text-[14px] text-gray-500 leading-snug hover:text-gray-700 transition-colors">
            {answer}
          </p>
        </button>
      )}
    </div>
  );
}
