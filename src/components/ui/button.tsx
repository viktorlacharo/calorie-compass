import { TextClassContext } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Platform, Pressable } from "react-native";

const buttonVariants = cva(
  cn(
    "group shrink-0 flex-row items-center justify-center gap-2 rounded-2xl",
    Platform.select({
      web: "focus-visible:border-ring focus-visible:ring-ring/50 whitespace-nowrap outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none",
    })
  ),
  {
    variants: {
      variant: {
        default: cn(
          "bg-brand active:bg-brand/90",
          Platform.select({ web: "hover:bg-brand/90" })
        ),
        destructive: cn(
          "bg-accent-red active:bg-accent-red/90",
          Platform.select({ web: "hover:bg-accent-red/90" })
        ),
        outline: cn(
          "border-border bg-surface/90 active:bg-forest-panel border",
          Platform.select({ web: "hover:bg-forest-panel" })
        ),
        secondary: cn(
          "bg-forest-panelAlt active:bg-forest-line",
          Platform.select({ web: "hover:bg-forest-line" })
        ),
        ghost: cn(
          "active:bg-forest-panel",
          Platform.select({ web: "hover:bg-forest-panel" })
        ),
        link: "",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 gap-1.5 px-3",
        lg: "h-12 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const buttonTextVariants = cva(
  cn(
    "text-sm font-sans-medium",
    Platform.select({ web: "pointer-events-none transition-colors" })
  ),
  {
    variants: {
      variant: {
        default: "text-white",
        destructive: "text-white",
        outline: "text-primary",
        secondary: "text-primary",
        ghost: "text-primary",
        link: cn(
          "text-brand group-active:underline",
          Platform.select({
            web: "underline-offset-4 hover:underline group-hover:underline",
          })
        ),
      },
      size: {
        default: "",
        sm: "",
        lg: "",
        icon: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type ButtonProps = React.ComponentProps<typeof Pressable> &
  React.RefAttributes<typeof Pressable> &
  VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider
      value={buttonTextVariants({ variant, size })}
    >
      <Pressable
        className={cn(
          props.disabled && "opacity-50",
          buttonVariants({ variant, size }),
          className
        )}
        accessibilityRole="button"
        accessibilityState={{ disabled: !!props.disabled }}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
