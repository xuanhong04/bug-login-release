import Image from "next/image";
import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => (
  <Image
    src="/buglogin-logo.webp"
    alt="BugLogin"
    width={256}
    height={256}
    className={cn("object-contain", className)}
  />
);
