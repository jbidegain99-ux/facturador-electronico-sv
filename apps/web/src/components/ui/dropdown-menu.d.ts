import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
declare const DropdownMenu: React.FC<PopoverPrimitive.PopoverProps>;
declare const DropdownMenuTrigger: React.ForwardRefExoticComponent<PopoverPrimitive.PopoverTriggerProps & React.RefAttributes<HTMLButtonElement>>;
declare const DropdownMenuContent: React.ForwardRefExoticComponent<Omit<PopoverPrimitive.PopoverContentProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuItem: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & {
    inset?: boolean;
} & React.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuLabel: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & {
    inset?: boolean;
} & React.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuSeparator: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, };
//# sourceMappingURL=dropdown-menu.d.ts.map