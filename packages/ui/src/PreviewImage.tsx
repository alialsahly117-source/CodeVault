import { cn } from "./utils";

// Preview images are mostly single-color brand/emoji icon SVGs, not photos —
// object-cover on a full-bleed dark box stretched them edge-to-edge and made
// dark icon fills nearly invisible against the app's navy background. A
// light backdrop with object-contain keeps them small, centered, and legible
// regardless of the icon's own fill color.
export function PreviewImage({
  src,
  alt,
  size = "hero",
  className,
}: {
  src: string;
  alt: string;
  size?: "hero" | "card";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-white",
        size === "hero" ? "h-48 p-8" : "h-28 p-4",
        className
      )}
    >
      <img
        src={src}
        alt={alt}
        className={cn("object-contain", size === "hero" ? "h-24 w-24" : "h-14 w-14")}
      />
    </div>
  );
}
