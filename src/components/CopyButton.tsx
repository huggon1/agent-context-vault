import { Check, Copy } from "lucide-react";
import * as React from "react";
import { Button } from "./ui/button";
import { useToast } from "./ui/toast";
import { cn } from "../lib/utils";

export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  className,
  size = "sm",
  variant = "outline",
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  size?: "sm" | "default" | "icon";
  variant?: "default" | "secondary" | "outline" | "ghost";
}) {
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast({ title: copiedLabel });
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" variant={variant} size={size} className={cn(className)} onClick={handleCopy}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {size === "icon" ? <span className="sr-only">{copied ? copiedLabel : label}</span> : copied ? copiedLabel : label}
    </Button>
  );
}
