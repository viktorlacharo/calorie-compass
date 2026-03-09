import { cn } from "@/lib/utils";
import { Platform, TextInput, type TextInputProps } from "react-native";

function Input({
  className,
  ...props
}: TextInputProps & React.RefAttributes<TextInput>) {
  return (
    <TextInput
      className={cn(
        "border-border bg-surface text-primary flex h-11 w-full min-w-0 flex-row items-center rounded-sm border px-3 py-1 font-sans text-base leading-5",
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
            "focus-visible:border-primary focus-visible:ring-primary/10 focus-visible:ring-[3px]"
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
