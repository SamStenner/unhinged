"use client";

import { HTMLAttributes, useState, ReactNode } from "react";
import { useProfile } from "@/lib/profile-context";
import { ChevronRightIcon } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { useIsMobile } from "@/lib/is-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Separator } from "./ui/separator";

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

function ResponsiveModal({ open, onOpenChange, title, children, footer }: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          {children}
          {footer && <DrawerFooter>{footer}</DrawerFooter>}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
        {footer && <DialogFooter className="flex-col sm:flex-col">{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

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
    <div>
      <button
        type="button"
        onClick={onClick}
        className={`w-full py-2 rounded-lg flex items-center justify-between hover:bg-gray-50 transition-colors
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
    </div>
  );
}

type ProfileVitalsProps = HTMLAttributes<HTMLDivElement>;

export default function ProfileVitals({ className, ...props }: ProfileVitalsProps) {
  const { profile, updateProfile } = useProfile();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [birthdayInput, setBirthdayInput] = useState("");
  const [birthdayError, setBirthdayError] = useState<string | null>(null);

  const handleBirthdayChange = (value: string) => {
    setBirthdayInput(value);
    setBirthdayError(null);

    if (!value) {
      return;
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      setBirthdayError("Please enter a valid date");
      return;
    }

    const year = date.getFullYear();
    const today = new Date();

    if (year < 1900) {
      setBirthdayError("Year must be 1900 or later");
      return;
    }

    if (date > today) {
      setBirthdayError("Birthday cannot be in the future");
      return;
    }

    const age = calculateAge(date);
    if (age < 18) {
      setBirthdayError("You must be at least 18 years old");
      return;
    }

    updateProfile({ age });
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

  const handleNameChange = (value: string) => {
    updateProfile({ name: value });
  };

  return (
    <div className={(className)} {...props}>
      {/* My Vitals Section - Hinge Style */}
      <div>
        <h3 className="text-[13px] font-medium text-gray-400 uppercase tracking-wide mb-2">
          My Vitals
        </h3>
        <div className="bg-white space-y-2">
          <VitalRow
            label="Name"
            value={profile.name}
            onClick={() => setEditingField("name")}
          />
          <Separator />
          <VitalRow
            label="Gender"
            value={profile.gender}
            onClick={() => setEditingField("gender")}
          />
          <Separator />
          <VitalRow
            label="Age"
            value={profile.age}
            onClick={() => setEditingField("age")}
          />
          <Separator />
          <VitalRow
            label="Height"
            value={profile.height}
            onClick={() => setEditingField("height")}
          />
          <Separator />
          <VitalRow
            label="Location"
            value={profile.location}
            onClick={() => setEditingField("location")}
            isLast
          />
        </div>
      </div>

      {/* Name Edit Modal */}
      <ResponsiveModal
        open={editingField === "name"}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Name"
        footer={
          <>
            <Button
              onClick={() => setEditingField(null)}
              className="w-full bg-[#67295F] hover:bg-[#5a2352]"
            >
              Done
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setEditingField(null)}>
              Cancel
            </Button>
          </>
        }
      >
        <div className="px-4 md:px-0 pb-4">
          <Input
            type="text"
            placeholder="Your name"
            value={profile.name || ""}
            onChange={(e) => handleNameChange(e.target.value)}
            className="h-12 rounded-xl text-[16px]"
            autoFocus
          />
          <p className="mt-2 text-[13px] text-gray-400">
            This is how you&apos;ll appear on your profile
          </p>
        </div>
      </ResponsiveModal>

      {/* Gender Edit Modal */}
      <ResponsiveModal
        open={editingField === "gender"}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Gender"
        footer={
          <Button variant="outline" className="w-full" onClick={() => setEditingField(null)}>
            Cancel
          </Button>
        }
      >
        <div className="px-4 md:px-0 pb-4">
          <RadioGroup
            value={profile.gender || ""}
            onValueChange={(value) => {
              handleGenderSelect(value);
              setEditingField(null);
            }}
            className="space-y-0"
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
      </ResponsiveModal>

      {/* Age Edit Modal */}
      <ResponsiveModal
        open={editingField === "age"}
        onOpenChange={(open) => {
          if (!open) {
            setEditingField(null);
            setBirthdayError(null);
          }
        }}
        title="Birthday"
        footer={
          <>
            <Button
              onClick={() => setEditingField(null)}
              className="w-full bg-[#67295F] hover:bg-[#5a2352]"
            >
              Done
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setEditingField(null)}>
              Cancel
            </Button>
          </>
        }
      >
        <div className="px-4 md:px-0 pb-4">
          <p className="text-[14px] text-gray-500 mb-4">Enter your birthday to calculate your age</p>
          <div>
            <Label className="text-[12px] text-gray-500 mb-1">Date of birth</Label>
            <Input
              type="date"
              value={birthdayInput}
              onChange={(e) => handleBirthdayChange(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              min="1900-01-01"
              className={`h-12 rounded-xl text-[16px] font-medium ${birthdayError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
            />
          </div>
          {birthdayError ? (
            <p className="mt-2 text-[14px] text-red-500 font-medium">
              {birthdayError}
            </p>
          ) : profile.age && profile.age > 0 ? (
            <p className="mt-4 text-[14px] text-[#67295F] font-medium text-center">
              You&apos;ll be shown as {profile.age} years old
            </p>
          ) : null}
        </div>
      </ResponsiveModal>

      {/* Height Edit Modal */}
      <ResponsiveModal
        open={editingField === "height"}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Height"
        footer={
          <Button variant="outline" className="w-full" onClick={() => setEditingField(null)}>
            Cancel
          </Button>
        }
      >
        <div className="px-4 md:px-0 ">
          <div className="py-2 max-h-[50vh] hide-scrollbar overflow-y-auto border rounded-xl px-2">
            <RadioGroup
              value={profile.height || ""}
              onValueChange={(value) => {
                handleHeightSelect(value);
                setEditingField(null);
              }}
              className="space-y-0 gap-1"
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
        </div>
      </ResponsiveModal>

      {/* Location Edit Modal */}
      <ResponsiveModal
        open={editingField === "location"}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Location"
        footer={
          <>
            <Button
              onClick={() => setEditingField(null)}
              className="w-full bg-[#67295F] hover:bg-[#5a2352]"
            >
              Done
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setEditingField(null)}>
              Cancel
            </Button>
          </>
        }
      >
        <div className="px-4 md:px-0 pb-4">
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
      </ResponsiveModal>
    </div>
  );
}
