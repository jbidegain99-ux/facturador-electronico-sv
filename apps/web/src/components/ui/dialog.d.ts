import * as React from 'react';
interface DialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}
declare const Dialog: ({ open, onOpenChange, children }: DialogProps) => React.JSX.Element;
declare const DialogTrigger: React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
} & React.RefAttributes<HTMLButtonElement>>;
declare const DialogPortal: ({ children }: {
    children: React.ReactNode;
}) => React.JSX.Element | null;
declare const DialogOverlay: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const DialogContent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const DialogHeader: {
    ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element;
    displayName: string;
};
declare const DialogFooter: {
    ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element;
    displayName: string;
};
declare const DialogTitle: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLHeadingElement>>;
declare const DialogDescription: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>;
export { Dialog, DialogPortal, DialogOverlay, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, };
//# sourceMappingURL=dialog.d.ts.map