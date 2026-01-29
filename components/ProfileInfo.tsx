import { CakeIcon, MapPinIcon, RulerIcon, UserIcon } from "lucide-react";

interface ProfileInfoProps {
  profile: {
    age?: number;
    gender?: string;
    height?: string;
    location?: string;
  };
}

export default function ProfileInfo({ profile }: ProfileInfoProps) {
  return (
    <div className="mx-4 my-3 bg-white rounded-2xl overflow-hidden border border-border">
      {/* Main stats row */}
      <div className="flex items-center gap-8 px-8 py-4 border-b border-border">
        <div className="flex flex-none items-center gap-2">
          <CakeIcon className="size-4.5" />
          <span className="text-base font-medium text-primary">
            {profile.age}
          </span>
        </div>
        <div className="w-px h-5 bg-gray-200" />
        <div className="flex flex-none items-center gap-2">
          <UserIcon className="size-4.5" />
          <span className="text-base text-primary">{profile.gender}</span>
        </div>
        <div className="w-px h-5 bg-gray-200" />
        <div className="flex flex-none items-center gap-2">
          <RulerIcon className="rotate-45 size-4.5" />
          <span className="text-base text-primary whitespace-nowrap">{profile.height}</span>
        </div>
      </div>

      {/* Location row */}
      {profile.location && (
        <div className="flex items-center px-5 py-4 gap-2">
          <MapPinIcon className="size-4.5" />
          <span className="text-base text-primary">{profile.location}</span>
        </div>
      )}
    </div>
  );
}
