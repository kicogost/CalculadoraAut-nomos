<!--
⚠️ BORRADOR — NO ES ASESORAMIENTO JURÍDICO. Versión en español (vinculante para los
usuarios), pendiente de revisión por un abogado de RGPD/LOPDGDD. Sustituye los
[CORCHETES]. Confirma la lista de subencargados y sus ubicaciones/garantías antes de
publicar.
-->

# Política de Privacidad — Provisio

**Última actualización: [FECHA] · Versión [X]**

En Provisio protegemos tus datos. **Nunca vendemos tus datos personales.** Esta política
explica qué recogemos, por qué y cuáles son tus derechos.

## 1. Responsable del tratamiento

**[RAZÓN SOCIAL, S.L.]**, CIF **[CIF]**, **[DOMICILIO SOCIAL]**. Contacto de
privacidad / DPD: **[privacidad@provisio.es]**. **[Nombrar un DPD si es obligatorio —
confirmar con el abogado.]**

## 2. Roles (importante)

- Respecto a tu **cuenta y los datos personales sobre ti**, somos el **responsable**.
- Respecto a los **datos personales de tus clientes/proveedores** que introduces para
  emitir facturas o llevar tus registros, **tú eres el responsable y nosotros el
  encargado** — regido por nuestro **Anexo de Tratamiento de Datos** (parte de los
  Términos). Tratamos esos datos solo para prestarte el Servicio.

## 3. Qué datos recogemos

| Categoría | Ejemplos | Origen |
|---|---|---|
| Identidad y cuenta | nombre, email, idioma, zona horaria, país | tú / acceso con Google |
| Consentimiento y cumplimiento | fechas de aceptación de términos/privacidad, opt-in de marketing, solicitudes de eliminación | tú / la app |
| Datos fiscales y de negocio | ingresos, gastos, facturas, clientes/proveedores, NIF/CIF/VAT, datos de IVA/IRPF, horas | tú (o importados) |
| Documentos subidos | PDF de facturas/gastos que envías al lector de IA | tú |
| Datos bancarios (solo Automatización) | datos de cuenta y transacciones, vía el proveedor AISP, **opt-in** | proveedor de open banking |
| Datos de pago | estado de suscripción, últimos 4 dígitos/metadatos (**la tarjeta completa la gestiona Stripe**) | Stripe |
| Técnicos/uso | dispositivo, registros y uso básico; cookies esenciales | automático |

Aplicamos **minimización de datos** — solo lo necesario para el Servicio. No subas datos
de categorías especiales (art. 9 RGPD) que no sean necesarios.

## 4. Para qué los usamos y base jurídica (art. 6 RGPD)

| Finalidad | Base jurídica |
|---|---|
| Prestar el Servicio (cuentas, cálculos, facturación, almacenamiento, lector IA, sincronización bancaria, pre-relleno) | **Contrato** (art. 6.1.b) |
| Facturación, pruebas, renovaciones, prevención del fraude | **Contrato** + **interés legítimo** (art. 6.1.f) |
| Seguridad, prevención de abusos, mejora del servicio | **Interés legítimo** (6.1.f) |
| Nuestras obligaciones legales/contables (p. ej., conservar nuestras facturas) | **Obligación legal** (6.1.c) |
| Emails de marketing | **Consentimiento** (6.1.a) — opt-in, revocable |

La conexión bancaria y el lector de IA son **funciones opcionales**; su uso forma parte
del contrato que decides activar, y la conexión bancaria requiere además tu autorización
expresa ante el proveedor.

## 5. Con quién los compartimos (subencargados)

Solo compartimos datos con proveedores que los tratan por cuenta nuestra bajo contrato:

| Subencargado | Finalidad | Ubicación / garantía |
|---|---|---|
| **Supabase** | base de datos, autenticación, almacenamiento | **región UE** (RGPD) |
| **Vercel** | hosting / CDN / serverless | **[CONFIRMAR región; CCT si fuera del EEE]** |
| **Stripe** | pagos | UE/EE. UU. — **CCT**, PCI-DSS |
| **[Anthropic]** | extracción de datos con IA | EE. UU. — **CCT**; **no se usa para entrenar modelos** según sus condiciones de API |
| **[GoCardless / AISP]** | datos bancarios (opt-in) | UE — opera bajo su propia licencia AISP |
| **[proveedor de email/auth]** | enlaces de acceso, notificaciones | **[CONFIRMAR]** |

**No** vendemos datos ni los compartimos con anunciantes. **[Mantener esta tabla
actualizada — es la lista canónica de subencargados; notificar cambios sustanciales.]**

## 6. Transferencias internacionales

Cuando un encargado está fuera del EEE, las transferencias se amparan en **decisiones de
adecuación o Cláusulas Contractuales Tipo (CCT)** con garantías adecuadas. Nuestro
almacén principal (Supabase) se mantiene en la **UE**.

## 7. Cuánto tiempo los conservamos

Véase la [Política de Retención y Eliminación de Datos](POLITICA-DE-RETENCION-DE-DATOS.md).
En resumen: mientras tu cuenta esté activa, más los plazos exigidos por la normativa
fiscal y mercantil española para los registros que estamos obligados a conservar.

## 8. Tus derechos (RGPD)

Puedes ejercer **acceso, rectificación, supresión, limitación, portabilidad y oposición**,
y **retirar el consentimiento** en cualquier momento, escribiendo a
**[privacidad@provisio.es]** o usando las herramientas de la app (exportación +
eliminación de cuenta). Puedes reclamar ante la **Agencia Española de Protección de Datos
(AEPD)** — www.aepd.es.

## 9. Seguridad

La seguridad a nivel de fila (RLS) aísla los datos de cada usuario (`auth.uid() =
user_id`); los datos se cifran en tránsito y en reposo; la base de datos principal está
en la UE; los secretos (claves de service-role/Stripe/IA) son solo de servidor y nunca se
exponen al navegador. Ningún sistema es perfectamente seguro, pero aplicamos medidas
técnicas y organizativas adecuadas.

## 10. Tratamiento con IA

Si usas el lector de IA, el documento que subes se envía a **[Anthropic]** únicamente para
extraer sus datos para ti; **no se usa para entrenar modelos de IA.** Puedes optar por no
usar esta función e introducir los datos manualmente.

## 11. Cookies

Usamos **cookies esenciales** necesarias para el funcionamiento del Servicio (p. ej.,
sesión/autenticación). **[Si añades analítica, enumérala aquí y obtén consentimiento según
la LSSI y la guía de la AEPD — o limítate a las esenciales e indícalo.]**

## 12. Menores

El Servicio no se dirige a menores de 18 años y no recogemos sus datos a sabiendas.

## 13. Cambios

Publicaremos las actualizaciones aquí y, para cambios sustanciales, te avisaremos
(email/in-app) y volveremos a pedir consentimiento cuando proceda.

## 14. Contacto

**[RAZÓN SOCIAL, S.L.]** · **[privacidad@provisio.es]** · DPD: **[…]**
