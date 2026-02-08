export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Términos y Condiciones</h1>
        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <p className="text-sm text-gray-500">Última actualización: Febrero 2026</p>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1. Aceptación de los Términos</h2>
            <p>
              Al registrarse y utilizar el servicio de Facturador Electrónico SV (en adelante, &quot;el Servicio&quot;),
              usted acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguno de estos
              términos, no utilice el Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2. Descripción del Servicio</h2>
            <p>
              El Servicio es una plataforma SaaS de facturación electrónica diseñada para cumplir con los
              requisitos del Ministerio de Hacienda de El Salvador. Permite la emisión, recepción y gestión de
              Documentos Tributarios Electrónicos (DTE).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3. Registro y Cuenta</h2>
            <p>
              Para utilizar el Servicio, usted debe proporcionar información veraz, completa y actualizada durante
              el proceso de registro, incluyendo NIT, NRC y demás datos fiscales requeridos por la legislación
              salvadoreña. Usted es responsable de mantener la confidencialidad de sus credenciales de acceso.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4. Obligaciones del Usuario</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Proporcionar información fiscal veraz y actualizada</li>
              <li>Mantener la seguridad de sus credenciales de acceso</li>
              <li>Cumplir con las obligaciones tributarias aplicables según la legislación de El Salvador</li>
              <li>No utilizar el Servicio para actividades ilegales o fraudulentas</li>
              <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5. Facturación Electrónica</h2>
            <p>
              El Servicio facilita la emisión de DTE conforme a las normativas del Ministerio de Hacienda.
              El usuario es el único responsable de la veracidad de la información contenida en los documentos
              emitidos. Republicode no se responsabiliza por errores en los datos ingresados por el usuario.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6. Disponibilidad del Servicio</h2>
            <p>
              Nos esforzamos por mantener el Servicio disponible de manera continua. Sin embargo, no garantizamos
              disponibilidad ininterrumpida. El Servicio puede estar temporalmente no disponible por mantenimiento,
              actualizaciones o causas fuera de nuestro control.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">7. Propiedad Intelectual</h2>
            <p>
              Todo el contenido, diseño, código y funcionalidades del Servicio son propiedad de Republicode.
              Se otorga al usuario una licencia limitada y no exclusiva para utilizar el Servicio según estos términos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8. Limitación de Responsabilidad</h2>
            <p>
              En la medida máxima permitida por la ley, Republicode no será responsable por daños indirectos,
              incidentales o consecuentes derivados del uso del Servicio. Nuestra responsabilidad total no
              excederá el monto pagado por el usuario en los últimos 12 meses.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">9. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de modificar estos Términos en cualquier momento. Los cambios serán
              notificados a los usuarios registrados por correo electrónico. El uso continuado del Servicio
              después de la notificación constituye aceptación de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">10. Ley Aplicable</h2>
            <p>
              Estos Términos se rigen por las leyes de la República de El Salvador. Cualquier disputa será
              resuelta ante los tribunales competentes de San Salvador, El Salvador.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">11. Contacto</h2>
            <p>
              Para consultas sobre estos Términos y Condiciones, puede contactarnos a través de los canales
              de soporte disponibles en la plataforma.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500">
            Powered by <span className="font-medium">Republicode</span>
          </p>
        </div>
      </div>
    </div>
  );
}
