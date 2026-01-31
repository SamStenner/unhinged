import { CakeIcon, MapPinIcon, RulerIcon, UserIcon } from "lucide-react";
import { Fragment, ReactNode } from "react";

interface ProfileInfoProps {
  profile: {
    name?: string;
    age?: number;
    gender?: string;
    height?: string;
    location?: string;
  };
}

export default function ProfileInfo({ profile }: ProfileInfoProps) {
  // Build array of defined vitals
  const vitals: { key: string; icon: ReactNode; value: ReactNode }[] = [];

  if (profile.age !== undefined) {
    vitals.push({
      key: "age",
      icon: <CakeIcon className="size-4.5" />,
      value: (
        <span className="text-base font-medium text-primary">
          {profile.age}
        </span>
      ),
    });
  }

  if (profile.gender) {
    vitals.push({
      key: "gender",
      icon: <UserIcon className="size-4.5" />,
      value: <span className="text-base text-primary">{profile.gender}</span>,
    });
  }

  if (profile.height) {
    vitals.push({
      key: "height",
      icon: <RulerIcon className="rotate-45 size-4.5" />,
      value: (
        <span className="text-base text-primary whitespace-nowrap">
          {profile.height}
        </span>
      ),
    });
  }

  const hasVitals = vitals.length > 0;
  const hasLocation = !!profile.location;

  // Don't render anything if no vitals, no location
  if (!hasVitals && !hasLocation) {
    return null;
  }

  return (
    <div className="mx-4 my-3 bg-white rounded-2xl overflow-hidden border border-border">
      {/* Main stats row */}
      {hasVitals && (
        <div
          className={`flex items-center gap-8 px-8 py-4 ${hasLocation ? "border-b border-border" : ""}`}
        >
          {vitals.map((vital, index) => (
            <Fragment key={vital.key}>
              {index > 0 && <div className="w-px h-5 bg-gray-200" />}
              <div className="flex flex-none items-center gap-2">
                {vital.icon}
                {vital.value}
              </div>
            </Fragment>
          ))}
        </div>
      )}

      {/* Location row */}
      {hasLocation && (
        <div className="flex items-center px-5 py-4 gap-2">
          <MapPinIcon className="size-4.5" />
          <span className="text-base text-primary">{profile.location}</span>
        </div>
      )}
    </div>
  );
}
