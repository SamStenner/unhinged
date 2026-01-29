"use client";

import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";

interface OnboardingData {
  gender: string;
  birthday: Date | null;
  location: string;
  height: string;
}

interface OnboardingProps {
  open: boolean;
  onComplete: (data: OnboardingData) => void;
  onSkip: () => void;
}

const genderOptions = ["Man", "Woman"];

const heightOptions = [
  "4' 0\"", "4' 1\"", "4' 2\"", "4' 3\"", "4' 4\"", "4' 5\"", "4' 6\"", "4' 7\"", "4' 8\"", "4' 9\"", "4' 10\"", "4' 11\"",
  "5' 0\"", "5' 1\"", "5' 2\"", "5' 3\"", "5' 4\"", "5' 5\"", "5' 6\"", "5' 7\"", "5' 8\"", "5' 9\"", "5' 10\"", "5' 11\"",
  "6' 0\"", "6' 1\"", "6' 2\"", "6' 3\"", "6' 4\"", "6' 5\"", "6' 6\"", "6' 7\"", "6' 8\"", "6' 9\"", "6' 10\"", "6' 11\"",
  "7' 0\"",
];

export default function Onboarding({ open, onComplete, onSkip }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    gender: "",
    birthday: null,
    location: "",
    height: "",
  });
  const [birthdayInput, setBirthdayInput] = useState({
    month: "",
    day: "",
    year: "",
  });

  const totalSteps = 4;

  const handleGenderSelect = (gender: string) => {
    setData((prev) => ({ ...prev, gender }));
  };

  const handleBirthdayChange = (field: "month" | "day" | "year", value: string) => {
    const numericValue = value.replace(/\D/g, "");

    let limitedValue = numericValue;
    if (field === "month") limitedValue = numericValue.slice(0, 2);
    if (field === "day") limitedValue = numericValue.slice(0, 2);
    if (field === "year") limitedValue = numericValue.slice(0, 4);

    const newBirthdayInput = { ...birthdayInput, [field]: limitedValue };
    setBirthdayInput(newBirthdayInput);

    const month = parseInt(newBirthdayInput.month, 10);
    const day = parseInt(newBirthdayInput.day, 10);
    const year = parseInt(newBirthdayInput.year, 10);

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= new Date().getFullYear()) {
      const date = new Date(year, month - 1, day);
      if (date.getMonth() === month - 1 && date.getDate() === day) {
        setData((prev) => ({ ...prev, birthday: date }));
      }
    }
  };

  const handleLocationChange = (value: string) => {
    setData((prev) => ({ ...prev, location: value }));
  };

  const handleHeightSelect = (height: string) => {
    setData((prev) => ({ ...prev, height }));
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return data.gender !== "";
      case 1:
        return data.birthday !== null;
      case 2:
        return data.location.trim() !== "";
      case 3:
        return data.height !== "";
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      onComplete(data);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onSkip();
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 0:
        return "What's your gender?";
      case 1:
        return "When's your birthday?";
      case 2:
        return "Where are you located?";
      case 3:
        return "How tall are you?";
      default:
        return "";
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 0:
        return "This helps us personalize your experience";
      case 1:
        return "We'll use this to calculate your age";
      case 2:
        return "This will be shown on your profile";
      case 3:
        return "This will be shown on your profile";
      default:
        return "";
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-3">
            {genderOptions.map((gender) => (
              <button
                key={gender}
                type="button"
                onClick={() => handleGenderSelect(gender)}
                className={`w-full py-4 px-5 rounded-xl border-2 text-left text-[16px] font-medium transition-all ${data.gender === gender
                  ? "border-[#67295F] bg-[#67295F]/5 text-[#67295F]"
                  : "border-gray-200 bg-white text-black hover:border-gray-300"
                  }`}
              >
                {gender}
              </button>
            ))}
          </div>
        );

      case 1:
        return (
          <div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[13px] font-medium text-gray-500 mb-2">
                  Month
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="MM"
                  value={birthdayInput.month}
                  onChange={(e) => handleBirthdayChange("month", e.target.value)}
                  className="w-full py-4 px-4 rounded-xl border-2 border-gray-200 text-center text-[18px] font-medium focus:outline-none focus:border-[#67295F] transition-colors"
                  autoFocus
                />
              </div>
              <div className="flex-1">
                <label className="block text-[13px] font-medium text-gray-500 mb-2">
                  Day
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="DD"
                  value={birthdayInput.day}
                  onChange={(e) => handleBirthdayChange("day", e.target.value)}
                  className="w-full py-4 px-4 rounded-xl border-2 border-gray-200 text-center text-[18px] font-medium focus:outline-none focus:border-[#67295F] transition-colors"
                />
              </div>
              <div className="flex-[1.5]">
                <label className="block text-[13px] font-medium text-gray-500 mb-2">
                  Year
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="YYYY"
                  value={birthdayInput.year}
                  onChange={(e) => handleBirthdayChange("year", e.target.value)}
                  className="w-full py-4 px-4 rounded-xl border-2 border-gray-200 text-center text-[18px] font-medium focus:outline-none focus:border-[#67295F] transition-colors"
                />
              </div>
            </div>
            {data.birthday && (
              <p className="mt-4 text-[14px] text-gray-500 text-center">
                You&apos;ll be shown as {calculateAge(data.birthday)} years old
              </p>
            )}
          </div>
        );

      case 2:
        return (
          <div>
            <input
              type="text"
              placeholder="City, State"
              value={data.location}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="w-full py-4 px-5 rounded-xl border-2 border-gray-200 text-[16px] focus:outline-none focus:border-[#67295F] transition-colors"
            />
            <p className="mt-3 text-[13px] text-gray-400">
              Example: Atlanta, GA
            </p>
          </div>
        );

      case 3:
        return (
          <div className="max-h-[240px] overflow-y-auto hide-scrollbar rounded-xl border-2 border-gray-200 bg-white">
            {heightOptions.map((height) => (
              <button
                key={height}
                type="button"
                onClick={() => handleHeightSelect(height)}
                className={`w-full py-3.5 px-5 text-left text-[16px] border-b border-border last:border-b-0 transition-all ${data.height === height
                  ? "bg-[#67295F]/5 text-[#67295F] font-medium"
                  : "text-black hover:bg-gray-50"
                  }`}
              >
                {height}
              </button>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <div className="mx-auto w-full max-w-[430px]">
          {/* Header with back button and skip */}
          <div className="flex items-center justify-between px-4 pt-2">
            <button
              type="button"
              onClick={handleBack}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-opacity ${step === 0 ? "opacity-0 pointer-events-none" : "hover:bg-gray-100"
                }`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="text-[15px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-4 py-3">
            <div className="flex gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-[#67295F]" : "bg-gray-200"
                    }`}
                />
              ))}
            </div>
          </div>

          <DrawerHeader className="text-left">
            <DrawerTitle className="text-[24px] font-bold text-black">
              {getStepTitle()}
            </DrawerTitle>
            <DrawerDescription className="text-[15px]">
              {getStepDescription()}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-2">
            {renderStepContent()}
          </div>

          <DrawerFooter className="pb-8">
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className={`w-full py-4 rounded-full text-[16px] font-semibold transition-all ${canProceed()
                ? "bg-[#67295F] text-white hover:bg-[#5a2352]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
            >
              {step === totalSteps - 1 ? "Get Started" : "Continue"}
            </button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function calculateAge(birthday: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const monthDiff = today.getMonth() - birthday.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
    age--;
  }
  return age;
}
