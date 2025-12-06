"use client";

import dynamic from "next/dynamic";

const UnicornScene = dynamic(() => import("unicornstudio-react"), {
  ssr: false,
  loading: () => null,
});

interface UnicornBackgroundProps {
  projectId: string;
  className?: string;
}

export function UnicornBackground({ projectId, className = "" }: UnicornBackgroundProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <UnicornScene
        projectId={projectId}
        scale={1}
        dpi={1.5}
        fps={60}
        production={true}
        altText="Animated background"
        ariaLabel="Decorative animated background"
        className="h-full w-full"
      />
    </div>
  );
}
