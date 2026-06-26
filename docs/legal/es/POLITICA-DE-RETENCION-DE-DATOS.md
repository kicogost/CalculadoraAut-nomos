<!--
⚠️ BORRADOR — NO ES ASESORAMIENTO JURÍDICO. Versión en español (vinculante), pendiente
de revisión por abogado de RGPD/LOPDGDD. Confirmar los plazos con la ley española vigente
(art. 30 Código de Comercio; prescripción tributaria LGT; limitación del plazo RGPD) y
con las condiciones de eliminación de cada encargado. Vinculada a los campos del esquema
account_deletion_requested_at, terms_accepted_at, privacy_policy_accepted_at,
marketing_opt_in_at.
-->

# Política de Retención y Eliminación de Datos — Provisio

**Última actualización: [FECHA] · Versión [X]**

Conservamos los datos personales solo el tiempo necesario para la finalidad con que se
recogieron, más el plazo exigido por ley. Esta política explica cuánto y cómo funciona la
eliminación.

## 1. Dos tipos de datos (la distinción clave)

1. **Tus datos, custodiados para ti** (registros fiscales, facturas, clientes,
   documentos). Son tuyos — los eliminamos cuando eliminas tu cuenta, sujeto al apdo. 4.
2. **Registros que debemos conservar por ley** (p. ej., las facturas que *nosotros* te
   emitimos y nuestros registros contables/de facturación). Debemos conservarlos durante
   el plazo legal aunque te des de baja — minimizados y con acceso restringido.

## 2. Calendario de retención

| Dato | Conservación | Base |
|---|---|---|
| Cuenta y perfil | Vida de la cuenta; eliminado en **[30] días** | limitación del plazo |
| Tus datos fiscales/de negocio (ingresos, gastos, facturas, clientes) | Vida de la cuenta; eliminados al borrar la cuenta (apdos. 3–4) | los controlas tú |
| Documentos subidos (lector IA) | Procesados y **no conservados por el proveedor de IA para entrenamiento**; almacenados en tu cuenta hasta que los borres | minimización |
| Datos de conexión bancaria (Automatización) | Mientras esté conectada; eliminados al desconectar/borrar cuenta | consentimiento + contrato |
| Registros de consentimiento (fechas de términos/privacidad/marketing) | Vida de la cuenta **+ [hasta 3] años** después, como prueba | legal/defensa de reclamaciones |
| Nuestras facturas a ti + registros contables/de facturación | **[6] años** (Código de Comercio) / periodos fiscales (LGT) | **obligación legal** |
| `stripe_events` / registro de auditoría de pagos | **[6] años** o lo exigido | legal/contable |
| Registros de servidor/seguridad | **[90] días** (o lo necesario para seguridad) | interés legítimo |
| Copias de seguridad | Purgadas en la rotación normal, en **[30–90] días** | técnico |

**[Todos los plazos entre corchetes a confirmar por el abogado.]**

## 3. Cómo funciona la eliminación de la cuenta

1. Solicitas la eliminación en la app (o por email). Registramos la hora en
   `account_deletion_requested_at`.
2. **Periodo de gracia de [30] días** durante el cual puedes cancelar la solicitud y
   recuperar la cuenta (evita pérdidas accidentales). Te indicamos cuándo empieza y
   termina.
3. Tras el periodo de gracia, **eliminamos definitivamente** los datos de tu cuenta de la
   base de datos en producción (borrado en cascada sobre `auth.users`) e **instruimos a
   nuestros encargados** para que eliminen los datos correspondientes.
4. Las **copias de seguridad** que contienen los datos se sobrescriben en la rotación
   normal (en **[30–90] días**); no restauramos usuarios eliminados desde copia salvo
   obligación legal.

## 4. Qué sobrevive a la eliminación (y por qué)

- Registros que estamos **legalmente obligados** a conservar (nuestras facturas a ti,
  contabilidad/facturación, registros de fraude/abuso) — durante el plazo legal, con
  acceso restringido, y luego eliminados.
- Estadísticas **agregadas/anonimizadas** que ya no te identifican.

## 5. Exporta antes de eliminar

Puedes **exportar tus datos** (JSON) en cualquier momento desde la pantalla de cuenta.
Recomendamos exportar antes de eliminar, ya que la eliminación es irreversible tras el
periodo de gracia.

## 6. Eliminación en nuestros encargados

| Encargado | Tratamiento de la eliminación |
|---|---|
| **Supabase** | borrado en cascada sobre `auth.users`; las copias rotan |
| **Stripe** | suscripción cancelada; Stripe conserva los registros de facturación por los plazos legales |
| **[Anthropic]** | las entradas de API no se usan para entrenamiento; retención/eliminación según su política de datos de API **[confirmar plazo]** |
| **[GoCardless / AISP]** | conexión bancaria revocada; el proveedor elimina según sus condiciones |
| **[proveedor de email/auth]** | registros de cuenta/acceso eliminados **[confirmar]** |

## 7. Contacto

Solicitudes y consultas: **[privacidad@provisio.es]** — **[RAZÓN SOCIAL, S.L.]**.
También puedes reclamar ante la **AEPD** (www.aepd.es).
