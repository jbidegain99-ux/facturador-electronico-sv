import Link from 'next/link';
import { FileText, Shield, Zap, Building2, CheckCircle, ArrowRight } from 'lucide-react';
import { FacturoLogo } from '@/components/brand/FacturoLogo';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-0 border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <FacturoLogo variant="full" size="md" />
          <div className="flex items-center gap-4">
            <Link href="/login" className="btn-secondary text-sm px-4 py-2">
              Iniciar Sesion
            </Link>
            <Link href="/register" className="btn-primary text-sm px-4 py-2">
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

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-muted-foreground">100% Compatible con Ministerio de Hacienda</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">Facturo</span>
            <br />
            <span className="text-white">Facturacion Electronica</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Plataforma de facturacion electronica para El Salvador.
            Emite facturas, creditos fiscales, notas de credito y mas.
            100% compatible con el Ministerio de Hacienda.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="btn-primary text-lg px-8 py-4 flex items-center gap-2">
              Comenzar Gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="btn-secondary text-lg px-8 py-4">
              Ya tengo cuenta
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto">
            <div className="glass-card p-6 card-hover">
              <div className="text-3xl font-bold gradient-text">50+</div>
              <div className="text-sm text-muted-foreground mt-1">DTEs Gratis/Mes</div>
            </div>
            <div className="glass-card p-6 card-hover">
              <div className="text-3xl font-bold gradient-text">99.9%</div>
              <div className="text-sm text-muted-foreground mt-1">Uptime</div>
            </div>
            <div className="glass-card p-6 card-hover">
              <div className="text-3xl font-bold gradient-text">24/7</div>
              <div className="text-sm text-muted-foreground mt-1">Soporte</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Todo lo que necesitas para facturar
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Cumple con todos los requisitos del Ministerio de Hacienda de El Salvador
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass-card p-8 card-hover">
              <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-6">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Todos los DTEs</h3>
              <p className="text-muted-foreground">
                Facturas, Creditos Fiscales, Notas de Credito, Notas de Debito,
                Comprobantes de Retencion y mas.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card p-8 card-hover">
              <div className="w-14 h-14 rounded-xl gradient-secondary flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Firma Digital</h3>
              <p className="text-muted-foreground">
                Firma automatica de documentos con tu certificado digital.
                Seguridad y autenticidad garantizada.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card p-8 card-hover">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Transmision al MH</h3>
              <p className="text-muted-foreground">
                Envio automatico al Ministerio de Hacienda.
                Recibe el sello de recepcion en segundos.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass-card p-8 card-hover">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mb-6">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Multi-Empresa</h3>
              <p className="text-muted-foreground">
                Gestiona multiples empresas desde una sola cuenta.
                Ideal para contadores y despachos.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="glass-card p-8 card-hover">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mb-6">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Validacion en Tiempo Real</h3>
              <p className="text-muted-foreground">
                Valida tus documentos antes de enviarlos.
                Evita rechazos y errores costosos.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="glass-card p-8 card-hover">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Reportes y Estadisticas</h3>
              <p className="text-muted-foreground">
                Dashboard con metricas en tiempo real.
                Exporta reportes para tu contabilidad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Planes para cada necesidad
            </h2>
            <p className="text-muted-foreground text-lg">
              Comienza gratis y escala segun tu negocio crece
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Trial Plan */}
            <div className="glass-card p-8">
              <div className="text-lg font-medium text-muted-foreground mb-2">Prueba</div>
              <div className="text-4xl font-bold text-white mb-1">Gratis</div>
              <div className="text-sm text-muted-foreground mb-6">Para siempre</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  50 DTEs por mes
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  1 Usuario
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Soporte por email
                </li>
              </ul>
              <Link href="/register" className="btn-secondary w-full text-center block">
                Comenzar Gratis
              </Link>
            </div>

            {/* Professional Plan */}
            <div className="glass-card p-8 border-2 border-primary relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary rounded-full text-xs font-medium text-white">
                Popular
              </div>
              <div className="text-lg font-medium text-muted-foreground mb-2">Profesional</div>
              <div className="text-4xl font-bold text-white mb-1">$29<span className="text-lg font-normal text-muted-foreground">/mes</span></div>
              <div className="text-sm text-muted-foreground mb-6">Facturado mensualmente</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  500 DTEs por mes
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  5 Usuarios
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Soporte prioritario
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  API Access
                </li>
              </ul>
              <Link href="/register" className="btn-primary w-full text-center block">
                Comenzar Ahora
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="glass-card p-8">
              <div className="text-lg font-medium text-muted-foreground mb-2">Empresa</div>
              <div className="text-4xl font-bold text-white mb-1">$99<span className="text-lg font-normal text-muted-foreground">/mes</span></div>
              <div className="text-sm text-muted-foreground mb-6">Facturado mensualmente</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  DTEs Ilimitados
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Usuarios Ilimitados
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Soporte 24/7
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Multi-empresa
                </li>
              </ul>
              <Link href="/register" className="btn-secondary w-full text-center block">
                Contactar Ventas
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="glass-card p-12 glow-primary">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Comienza a facturar hoy
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Registrate gratis y emite tu primera factura electronica en minutos.
              Sin tarjeta de credito requerida.
            </p>
            <Link href="/register" className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2">
              Crear Cuenta Gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <FacturoLogo variant="full" size="sm" />
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-white transition-colors">Terminos</Link>
              <Link href="#" className="hover:text-white transition-colors">Privacidad</Link>
              <Link href="#" className="hover:text-white transition-colors">Soporte</Link>
            </div>
            <div className="text-sm text-muted-foreground">
              by <span className="gradient-text font-semibold">Republicode</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
