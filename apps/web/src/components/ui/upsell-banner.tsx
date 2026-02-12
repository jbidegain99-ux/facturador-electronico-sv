'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Check, Rocket } from 'lucide-react';

interface UpsellBannerProps {
  title: string;
  description: string;
  features: string[];
  ctaText?: string;
  ctaHref?: string;
}

export function UpsellBanner({
  title,
  description,
  features,
  ctaText = 'Actualizar a Plan Pro',
  ctaHref = '/configuracion',
}: UpsellBannerProps) {
  return (
    <Card className="max-w-2xl mx-auto border-purple-500/30">
      <CardContent className="p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center">
          <Star className="h-8 w-8 text-purple-400" />
        </div>

        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-muted-foreground mt-2">{description}</p>
        </div>

        <div className="text-left max-w-md mx-auto space-y-3">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-400 shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>

        <Link href={ctaHref}>
          <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
            <Rocket className="mr-2 h-5 w-5" />
            {ctaText}
          </Button>
        </Link>

        <p className="text-xs text-muted-foreground">
          Contacta a soporte para mas informacion sobre planes y precios.
        </p>
      </CardContent>
    </Card>
  );
}
