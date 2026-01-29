"use client";

import { useState } from "react";
import { useIsMobile } from "@/lib/is-mobile";
import { PlusIcon, SparklesIcon, ZapIcon, CrownIcon, FlameIcon } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const petalPackages = [
  {
    id: "starter",
    petals: 50,
    price: "$4.99",
    icon: SparklesIcon,
    popular: false,
    color: "from-pink-400 to-pink-500",
  },
  {
    id: "popular",
    petals: 150,
    price: "$9.99",
    icon: FlameIcon,
    popular: true,
    color: "from-[#67295F] to-[#8B3D7F]",
    savings: "Save 33%",
  },
  {
    id: "premium",
    petals: 400,
    price: "$19.99",
    icon: CrownIcon,
    popular: false,
    color: "from-amber-400 to-amber-500",
    savings: "Save 50%",
  },
];

function SettingsContent() {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  // Placeholder petal balance
  const petalBalance = 42;

  const handlePurchase = () => {
    if (!selectedPackage) return;
    // Placeholder - would integrate with payment provider
    alert(`Purchase ${selectedPackage} package - coming soon!`);
  };

  return (
    <div className="flex flex-col px-6 pb-8 pt-2">
      {/* Current Balance */}
      <div className="text-center mb-6">
        <p className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-2">
          Your Balance
        </p>
        <div className="flex items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F5B5D0] to-[#E890B0] flex items-center justify-center shadow-md">
            <span className="text-lg">🌸</span>
          </div>
          <span className="text-4xl font-bold text-gray-900">{petalBalance}</span>
          <span className="text-lg text-gray-500 font-medium">petals</span>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
          Get more petals
        </span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Package Options */}
      <div className="space-y-3 mb-6">
        {petalPackages.map((pkg) => {
          const Icon = pkg.icon;
          const isSelected = selectedPackage === pkg.id;

          return (
            <button
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg.id)}
              className={`w-full p-4 rounded-2xl border-2 transition-all relative ${isSelected
                  ? "border-[#67295F] bg-[#67295F]/5"
                  : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
            >
              {pkg.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#67295F] text-white text-xs font-semibold rounded-full">
                  Most Popular
                </div>
              )}

              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pkg.color} flex items-center justify-center shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Details */}
                <div className="flex-1 text-left">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-gray-900">{pkg.petals}</span>
                    <span className="text-sm text-gray-500">petals</span>
                  </div>
                  {pkg.savings && (
                    <span className="text-xs font-medium text-green-600">{pkg.savings}</span>
                  )}
                </div>

                {/* Price */}
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900">{pkg.price}</span>
                </div>

                {/* Selection indicator */}
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected
                    ? "border-[#67295F] bg-[#67295F]"
                    : "border-gray-300"
                  }`}>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Purchase Button */}
      <Button
        onClick={handlePurchase}
        disabled={!selectedPackage}
        className="w-full h-12 bg-[#67295F] hover:bg-[#5a2352] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-[15px] rounded-full shadow-lg shadow-[#67295F]/20 transition-all hover:shadow-xl hover:shadow-[#67295F]/30 disabled:shadow-none"
      >
        <PlusIcon className="w-5 h-5 mr-2" />
        {selectedPackage ? "Purchase Petals" : "Select a package"}
      </Button>

      {/* What are petals? */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <ZapIcon className="w-4 h-4 text-[#67295F]" />
          What are petals?
        </h4>
        <p className="text-sm text-gray-500 leading-relaxed">
          Petals are the currency of Unhinged. Use them to boost your profile,
          send roses to standout profiles, and unlock premium features.
        </p>
      </div>

      {/* Terms */}
      <p className="text-xs text-gray-400 text-center mt-4">
        All purchases are non-refundable. By purchasing, you agree to our Terms of Service.
      </p>
    </div>
  );
}

interface SettingsDrawerProps {
  children: React.ReactNode;
}

export default function SettingsDrawer({ children }: SettingsDrawerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent className="bg-white">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Settings & Billing</DrawerTitle>
            <DrawerDescription>
              Manage your petals and purchase more
            </DrawerDescription>
          </DrawerHeader>
          <SettingsContent />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-white sm:max-w-[420px] p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Settings & Billing</DialogTitle>
          <DialogDescription>
            Manage your petals and purchase more
          </DialogDescription>
        </DialogHeader>
        <SettingsContent />
      </DialogContent>
    </Dialog>
  );
}
