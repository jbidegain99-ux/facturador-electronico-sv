'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, Shield, Zap, Building2, CheckCircle, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ContactSalesDialog } from '@/components/contact-sales-dialog';

export default function Home() {
  const [contactOpen, setContactOpen] = React.useState(false);
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-0 border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg gradient-primary flex items-center justify-center">
              <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-base sm:text-xl font-bold text-foreground hidden sm:inline">Facturador SV</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/login" className="btn-secondary text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2">
              Iniciar Sesión
            </Link>
            <ThemeToggle />
            <Link href="/register" className="btn-primary text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2">
              Registrarse
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background Glows */}
        <div className="hero-glow top-0 left-1/4 -translate-x-1/2" />
        <div className="hero-glow bottom-0 right-1/4 translate-x-1/2 opacity-50" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full glass-card mb-6 sm:mb-8">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs sm:text-sm text-muted-foreground">100% Compatible con Ministerio de Hacienda</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6">
            <span className="text-foreground">Facturación Electrónica</span>
            <br />
            <span className="gradient-text">para El Salvador</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10">
            Sistema completo de facturación electrónica DTE.
            Emite facturas, créditos fiscales, notas de crédito y más.
            Todo en cumplimiento con la normativa del MH.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link href="/register" className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 flex items-center justify-center gap-2 w-full sm:w-auto">
              Comenzar Gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto text-center">
              Ya tengo cuenta
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-8 mt-12 sm:mt-20 max-w-3xl mx-auto">
            <div className="glass-card p-4 sm:p-6 card-hover">
              <div className="text-2xl sm:text-3xl font-bold gradient-text">10</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">DTEs Gratis/Mes</div>
            </div>
            <div className="glass-card p-4 sm:p-6 card-hover">
              <div className="text-2xl sm:text-3xl font-bold gradient-text">99.9%</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Uptime</div>
            </div>
            <div className="glass-card p-4 sm:p-6 card-hover">
              <div className="text-2xl sm:text-3xl font-bold gradient-text">24/7</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Soporte</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              Todo lo que necesitas para facturar
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
              Cumple con todos los requisitos del Ministerio de Hacienda de El Salvador
            </p>
          </div>

          <div className="grid gap-4 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="glass-card p-5 sm:p-8 card-hover">
              <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-6">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Todos los DTEs</h3>
              <p className="text-muted-foreground">
                Facturas, Créditos Fiscales, Notas de Crédito, Notas de Débito,
                Comprobantes de Retención y más.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card p-5 sm:p-8 card-hover">
              <div className="w-14 h-14 rounded-xl gradient-secondary flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Firma Digital</h3>
              <p className="text-muted-foreground">
                Firma automática de documentos con tu certificado digital.
                Seguridad y autenticidad garantizada.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card p-5 sm:p-8 card-hover">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Transmisión al MH</h3>
              <p className="text-muted-foreground">
                Envío automático al Ministerio de Hacienda.
                Recibe el sello de recepción en segundos.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass-card p-5 sm:p-8 card-hover">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mb-6">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Multi-Empresa</h3>
              <p className="text-muted-foreground">
                Gestiona múltiples empresas desde una sola cuenta.
                Ideal para contadores y despachos.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="glass-card p-5 sm:p-8 card-hover">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mb-6">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Validación en Tiempo Real</h3>
              <p className="text-muted-foreground">
                Valida tus documentos antes de enviarlos.
                Evita rechazos y errores costosos.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="glass-card p-5 sm:p-8 card-hover">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Reportes y Estadísticas</h3>
              <p className="text-muted-foreground">
                Dashboard con métricas en tiempo real.
                Exporta reportes para tu contabilidad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 sm:py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              Planes para cada necesidad
            </h2>
            <p className="text-muted-foreground text-lg">
              Comienza gratis y escala según tu negocio crece
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
            {/* FREE Plan */}
            <div className="glass-card p-6 sm:p-8">
              <div className="text-lg font-medium text-muted-foreground mb-2">Free</div>
              <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1">Gratis</div>
              <div className="text-sm text-muted-foreground mb-6">Para probar la plataforma</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  10 DTEs por mes
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  1 usuario, 10 clientes
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  Catálogo (50 items)
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  Soporte por ticket
                </li>
              </ul>
              <Link href="/register" className="btn-secondary w-full text-center block">
                Comenzar Gratis
              </Link>
            </div>

            {/* STARTER Plan */}
            <div className="glass-card p-6 sm:p-8">
              <div className="text-lg font-medium text-muted-foreground mb-2">Starter</div>
              <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1">$19<span className="text-lg font-normal text-muted-foreground">/mes</span></div>
              <div className="text-sm text-muted-foreground mb-6">Pymes empezando con DTE</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  300 DTEs por mes
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  3 usuarios, 100 clientes
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  Contabilidad integrada
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  Facturas recurrentes
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  Logo en tus facturas
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  Soporte 24h
                </li>
              </ul>
              <Link href="/register" className="btn-secondary w-full text-center block">
                Empezar Starter
              </Link>
            </div>

            {/* PROFESSIONAL Plan */}
            <div className="glass-card p-6 sm:p-8 border-2 border-primary relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary rounded-full text-xs font-medium text-white">
                Popular
              </div>
              <div className="text-lg font-medium text-muted-foreground mb-2">Professional</div>
              <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1">$65<span className="text-lg font-normal text-muted-foreground">/mes</span></div>
              <div className="text-sm text-muted-foreground mb-6">Empresas en crecimiento</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  2,000 DTEs por mes
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  10 usuarios, 500 clientes
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  Cotizaciones B2B + portal
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  Reportes avanzados
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  Email con tu dominio
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  Ayuda setup Hacienda
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  Soporte 12h, prioridad alta
                </li>
              </ul>
              <Link href="/register" className="btn-primary w-full text-center block">
                Empezar Professional
              </Link>
            </div>

            {/* ENTERPRISE Plan */}
            <div className="glass-card p-6 sm:p-8">
              <div className="text-lg font-medium text-muted-foreground mb-2">Enterprise</div>
              <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1">$199<span className="text-lg font-normal text-muted-foreground">/mes</span></div>
              <div className="text-sm text-muted-foreground mb-6">Sin límites + soporte crítico</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  DTEs ilimitados
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  Usuarios y sucursales ∞
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  API REST completa
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  Webhooks (ERP/CRM)
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  Teléfono + Account Manager
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  Chat en vivo
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  Soporte 2h, prioridad crítica
                </li>
              </ul>
              <button
                onClick={() => setContactOpen(true)}
                className="btn-secondary w-full text-center block"
              >
                Contactar Ventas
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-24 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="glass-card p-6 sm:p-12 glow-primary">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              Comienza a facturar hoy
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg mb-6 sm:mb-8 max-w-xl mx-auto">
              Regístrate gratis y emite tu primera factura electrónica en minutos.
              Sin tarjeta de crédito requerida.
            </p>
            <Link href="/register" className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 inline-flex items-center gap-2 w-full sm:w-auto justify-center">
              Crear Cuenta Gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-foreground">Facturador SV</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/terminos" className="hover:text-foreground transition-colors">Términos</Link>
              <Link href="/privacidad" className="hover:text-foreground transition-colors">Privacidad</Link>
              <Link href="mailto:soporte@facturosv.com" className="hover:text-foreground transition-colors">Soporte</Link>
            </div>
            <div className="text-sm text-muted-foreground">
              Powered by <span className="gradient-text font-semibold">Republicode</span>
            </div>
          </div>
        </div>
      </footer>

      <ContactSalesDialog open={contactOpen} onOpenChange={setContactOpen} />
    </div>
  );
}
