export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Política de Privacidad</h1>
        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <p className="text-sm text-gray-500">Última actualización: Febrero 2026</p>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1. Información que Recopilamos</h2>
            <p>Al utilizar el Facturador Electrónico SV, recopilamos la siguiente información:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Datos de registro:</strong> Nombre de la empresa, NIT, NRC, dirección, teléfono, correo electrónico, actividad económica</li>
              <li><strong>Datos del usuario:</strong> Nombre completo, correo electrónico, contraseña (encriptada)</li>
              <li><strong>Datos de facturación:</strong> Información de los DTE emitidos, datos de clientes y proveedores</li>
              <li><strong>Datos técnicos:</strong> Dirección IP, tipo de navegador, páginas visitadas, fecha y hora de acceso</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2. Uso de la Información</h2>
            <p>Utilizamos la información recopilada para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Proveer y mantener el servicio de facturación electrónica</li>
              <li>Emitir y gestionar Documentos Tributarios Electrónicos (DTE)</li>
              <li>Comunicarnos con usted sobre su cuenta y el servicio</li>
              <li>Cumplir con las obligaciones legales y fiscales ante el Ministerio de Hacienda</li>
              <li>Mejorar y personalizar la experiencia del usuario</li>
              <li>Prevenir fraude y garantizar la seguridad del servicio</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3. Almacenamiento y Seguridad</h2>
            <p>
              Los datos se almacenan en servidores seguros de Microsoft Azure. Implementamos medidas de seguridad
              técnicas y organizativas para proteger su información, incluyendo:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encriptación de datos en tránsito y en reposo</li>
              <li>Contraseñas hasheadas con algoritmos seguros (bcrypt)</li>
              <li>Autenticación basada en tokens JWT</li>
              <li>Respaldos periódicos de la base de datos</li>
              <li>Monitoreo continuo de seguridad</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4. Compartición de Datos</h2>
            <p>No vendemos ni alquilamos su información personal. Podemos compartir datos con:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Ministerio de Hacienda:</strong> Para el cumplimiento de obligaciones fiscales y la emisión de DTE</li>
              <li><strong>Proveedores de servicios:</strong> Terceros que nos asisten en la operación del servicio (hosting, correo electrónico)</li>
              <li><strong>Autoridades legales:</strong> Cuando sea requerido por ley o proceso legal</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5. Retención de Datos</h2>
            <p>
              Los datos fiscales y documentos tributarios se conservan por el período mínimo exigido por la
              legislación tributaria de El Salvador. Los datos de cuenta se conservan mientras el usuario
              mantenga una cuenta activa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6. Derechos del Usuario</h2>
            <p>Usted tiene derecho a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Acceder a sus datos personales almacenados en el sistema</li>
              <li>Solicitar la corrección de datos inexactos</li>
              <li>Solicitar la eliminación de su cuenta (sujeto a obligaciones legales de retención)</li>
              <li>Recibir una copia de sus datos en formato portable</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">7. Cookies y Tecnologías Similares</h2>
            <p>
              Utilizamos cookies y almacenamiento local del navegador para mantener su sesión activa y
              mejorar la experiencia de usuario. No utilizamos cookies de rastreo de terceros con fines
              publicitarios.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8. Cambios en esta Política</h2>
            <p>
              Nos reservamos el derecho de actualizar esta Política de Privacidad. Los cambios significativos
              serán notificados por correo electrónico a los usuarios registrados. La fecha de última
              actualización se indica al inicio de este documento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">9. Contacto</h2>
            <p>
              Para ejercer sus derechos o realizar consultas sobre privacidad, puede contactarnos a través
              de los canales de soporte disponibles en la plataforma.
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
