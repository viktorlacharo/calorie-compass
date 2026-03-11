import { cn } from "@/lib/utils";
import { Platform, TextInput, type TextInputProps } from "react-native";

function Input({
  className,
  ...props
}: TextInputProps & React.RefAttributes<TextInput>) {
  return (
    <TextInput
      className={cn(
        "border-border bg-surface/90 text-primary flex h-12 w-full min-w-0 flex-row items-center rounded-2xl border px-4 py-1 font-sans text-base leading-5",
        props.editable === false &&
          cn(
            "opacity-50",
            Platform.select({
              web: "disabled:pointer-events-none disabled:cursor-not-allowed",
            })
          ),
        Platform.select({
          web: cn(
            "placeholder:text-muted outline-none transition-[color,box-shadow]",
            "focus-visible:border-brand focus-visible:ring-brand/20 focus-visible:ring-[3px]"
          ),
          native: "placeholder:text-muted",
        }),
        className
      )}
      placeholderTextColor="#A8A29E"
      {...props}
    />
  );
}

export { Input };
