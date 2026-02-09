import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
declare const cardVariants: (props?: ({
    variant?: "default" | "solid" | "outline" | "ghost" | "glass" | "elevated" | null | undefined;
    hover?: "none" | "scale" | "glow" | "lift" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
}
declare const Card: React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>>;
declare const CardHeader: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const CardTitle: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLParagraphElement>>;
declare const CardDescription: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>;
declare const CardContent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const CardFooter: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
//# sourceMappingURL=card.d.ts.map