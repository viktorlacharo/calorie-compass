import { TextClassContext } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import * as Slot from "@rn-primitives/slot";
import { cva, type VariantProps } from "class-variance-authority";
import { View, type ViewProps } from "react-native";

const badgeVariants = cva(
  "group shrink-0 flex-row items-center justify-center overflow-hidden rounded-full border px-2.5 py-1",
  {
    variants: {
      variant: {
        default: "bg-brand border-transparent",
        secondary: "bg-forest-panelAlt border-border",
        destructive: "bg-accent-red border-transparent",
        outline: "border-border bg-surface/70",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const badgeTextVariants = cva("text-[10px] font-sans-medium tracking-widest uppercase", {
  variants: {
    variant: {
      default: "text-surface",
      secondary: "text-secondary",
      destructive: "text-surface",
      outline: "text-primary",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type BadgeProps = ViewProps &
  React.RefAttributes<View> & {
    asChild?: boolean;
  } & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, asChild, ...props }: BadgeProps) {
  const Component = asChild ? Slot.View : View;
  return (
    <TextClassContext.Provider value={badgeTextVariants({ variant })}>
      <Component
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

export { Badge, badgeTextVariants, badgeVariants };
export type { BadgeProps };
