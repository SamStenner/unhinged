"use client";

import { HTMLAttributes, useState } from "react";
import { useProfile } from "@/lib/profile-context";
import { ChevronRightIcon } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";

const genderOptions = ["Man", "Woman"];

const heightOptions = [
  "4' 0\"", "4' 1\"", "4' 2\"", "4' 3\"", "4' 4\"", "4' 5\"", "4' 6\"", "4' 7\"", "4' 8\"", "4' 9\"", "4' 10\"", "4' 11\"",
  "5' 0\"", "5' 1\"", "5' 2\"", "5' 3\"", "5' 4\"", "5' 5\"", "5' 6\"", "5' 7\"", "5' 8\"", "5' 9\"", "5' 10\"", "5' 11\"",
  "6' 0\"", "6' 1\"", "6' 2\"", "6' 3\"", "6' 4\"", "6' 5\"", "6' 6\"", "6' 7\"", "6' 8\"", "6' 9\"", "6' 10\"", "6' 11\"",
  "7' 0\"",
];

function calculateAge(birthday: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const monthDiff = today.getMonth() - birthday.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
    age--;
  }
  return age;
}

interface VitalRowProps {
  label: string;
  value: string | number | undefined;
  onClick: () => void;
  isLast?: boolean;
}

function VitalRow({ label, value, onClick, isLast = false }: VitalRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${!isLast ? "border-b border-gray-100" : ""
        }`}
    >
      <div className="text-left">
        <p className="text-[15px] font-semibold text-gray-900">{label}</p>
        <p className="text-[14px] text-gray-500">{value || "Not set"}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-gray-400">Always Visible</span>
        <ChevronRightIcon className="w-5 h-5 text-gray-300" />
      </div>
    </button>
  );
}

type ProfileVitalsProps = HTMLAttributes<HTMLDivElement>;

export default function ProfileVitals({ className, ...props }: ProfileVitalsProps) {
  const { profile, updateProfile } = useProfile();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [birthdayInput, setBirthdayInput] = useState({
    month: "",
    day: "",
    year: "",
  });

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
        updateProfile({ age: calculateAge(date) });
      }
    }
  };

  const handleGenderSelect = (gender: string) => {
    updateProfile({ gender });
  };

  const handleLocationChange = (value: string) => {
    updateProfile({ location: value });
  };

  const handleHeightSelect = (height: string) => {
    updateProfile({ height });
  };

  return (
    <div className={(className)} {...props}>
      {/* My Vitals Section - Hinge Style */}
      <div>
        <h3 className="text-[13px] font-medium text-gray-400 uppercase tracking-wide mb-2">
          My Vitals
        </h3>
        <div className="bg-white">
          <VitalRow
            label="Gender"
            value={profile.gender}
            onClick={() => setEditingField("gender")}
          />
          <VitalRow
            label="Age"
            value={profile.age}
            onClick={() => setEditingField("age")}
          />
          <VitalRow
            label="Height"
            value={profile.height}
            onClick={() => setEditingField("height")}
          />
          <VitalRow
            label="Location"
            value={profile.location}
            onClick={() => setEditingField("location")}
            isLast
          />
        </div>
      </div>

      {/* Gender Edit Drawer */}
      <Drawer open={editingField === "gender"} onOpenChange={(open) => !open && setEditingField(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Gender</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <RadioGroup
              value={profile.gender || ""}
              onValueChange={(value) => {
                handleGenderSelect(value);
                setEditingField(null);
              }}
              className="space-y-2"
            >
              {genderOptions.map((gender) => (
                <Label
                  key={gender}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${profile.gender === gender
                    ? "border-[#67295F] bg-[#67295F]/5"
                    : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <RadioGroupItem value={gender} className="sr-only" />
                  <span className={`text-[16px] font-medium ${profile.gender === gender ? "text-[#67295F]" : "text-gray-700"}`}>
                    {gender}
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Age Edit Drawer */}
      <Drawer open={editingField === "age"} onOpenChange={(open) => !open && setEditingField(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Birthday</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <p className="text-[14px] text-gray-500 mb-4">Enter your birthday to calculate your age</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-[12px] text-gray-500 mb-1">Month</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="MM"
                  value={birthdayInput.month}
                  onChange={(e) => handleBirthdayChange("month", e.target.value)}
                  className="h-12 rounded-xl text-center text-[16px] font-medium"
                />
              </div>
              <div className="flex-1">
                <Label className="text-[12px] text-gray-500 mb-1">Day</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="DD"
                  value={birthdayInput.day}
                  onChange={(e) => handleBirthdayChange("day", e.target.value)}
                  className="h-12 rounded-xl text-center text-[16px] font-medium"
                />
              </div>
              <div className="flex-[1.5]">
                <Label className="text-[12px] text-gray-500 mb-1">Year</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="YYYY"
                  value={birthdayInput.year}
                  onChange={(e) => handleBirthdayChange("year", e.target.value)}
                  className="h-12 rounded-xl text-center text-[16px] font-medium"
                />
              </div>
            </div>
            {profile.age && profile.age > 0 && (
              <p className="mt-4 text-[14px] text-[#67295F] font-medium text-center">
                You&apos;ll be shown as {profile.age} years old
              </p>
            )}
          </div>
          <DrawerFooter>
            <Button
              onClick={() => setEditingField(null)}
              className="w-full bg-[#67295F] hover:bg-[#5a2352]"
            >
              Done
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Height Edit Drawer */}
      <Drawer open={editingField === "height"} onOpenChange={(open) => !open && setEditingField(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Height</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 max-h-[50vh] overflow-y-auto">
            <RadioGroup
              value={profile.height || ""}
              onValueChange={(value) => {
                handleHeightSelect(value);
                setEditingField(null);
              }}
              className="space-y-1"
            >
              {heightOptions.map((height) => (
                <Label
                  key={height}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${profile.height === height
                    ? "bg-[#67295F]/10 text-[#67295F]"
                    : "hover:bg-gray-50 text-gray-700"
                    }`}
                >
                  <RadioGroupItem value={height} className="sr-only" />
                  <span className={`text-[16px] ${profile.height === height ? "font-semibold" : ""}`}>
                    {height}
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Location Edit Drawer */}
      <Drawer open={editingField === "location"} onOpenChange={(open) => !open && setEditingField(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Location</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <Input
              type="text"
              placeholder="City, State"
              value={profile.location || ""}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="h-12 rounded-xl text-[16px]"
              autoFocus
            />
            <p className="mt-2 text-[13px] text-gray-400">
              Example: San Francisco, CA
            </p>
          </div>
          <DrawerFooter>
            <Button
              onClick={() => setEditingField(null)}
              className="w-full bg-[#67295F] hover:bg-[#5a2352]"
            >
              Done
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
