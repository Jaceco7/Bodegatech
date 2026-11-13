# BodegaTech — Momento evaluativo 2

Proyecto original conservado: ERP Next.js 16 + Prisma 7 + PostgreSQL. Se añadió `/resenas` para las cuatro operaciones exigidas.

## Instalación y ejecución (usar copia de la base real, no modificar datos originales sin respaldo)

1. Instalar Node.js compatible con Next.js 16 (Node 20.9+).
2. `npm ci`
3. Crear `.env` copiando `.env.example` y configurar `DATABASE_URL` con usuario/contraseña propios (no se suministran en el ZIP).
4. **Respaldar** la base y trabajar de preferencia sobre una base de ensayo, con usuarios, categorías y productos existentes.
5. `npx prisma migrate deploy` (aplica migración aditiva de reviews y discountPercent).
6. `npx prisma generate`
7. `npm run dev` y abrir `http://localhost:3000/resenas`.

La migración añade la tabla física `reviews` con `CHECK (rating BETWEEN 0 AND 5)`, llaves foráneas a `User` y `Product`, PK para review_id, índice en productId y descuento con CHECK 0–100. No elimina ni modifica registros previos. Los nombres físicos originales del ERP son `User`, `Category`, `Product`; equivalen conceptualmente a users/categories/products de la guía y se conservaron por compatibilidad.

## Demostración

- 1: Seleccionar usuario y producto, poner rating 4 y guardar; aparece en las últimas reseñas.
- 2: Seleccionar categoría y consultar promedio y número de reseñas (el cálculo sale de `reviews`).
- 3: Elegir producto y cambiar descuento a 10; comprobar valor actualizado.
- 4: Poner rating -1 o 6 y guardar; la app informa rechazo de la base. Verificar que no se insertó. El campo no tiene min/max deliberadamente para demostrar el CHECK real.

## Proceso de datos reproducible

Rellenar `01_dataset/reviews.csv` con cabecera igual a `01_dataset/FORMATO_reviews.csv`; los IDs deben existir en la base. Luego:

`node --env-file=.env scripts/import_reviews.mjs 01_dataset/reviews.csv`

Salida `03_informe/importacion_resultado.json`: registros de entrada, aceptados, rechazados, duplicados y detalles. Ejecutar dos veces: en la segunda, los `review_id` ya guardados cuentan como duplicados y no se insertan de nuevo (`ON CONFLICT DO NOTHING`). El informe muestra conteos reales **solo después de ejecutar** sobre una base configurada. No se incluyen datos personales ficticios.

Consultas SQL explicativas: `02_notebook/consultas_momento2.sql`.
Documento académico: `03_informe/Momento_2_BodegaTech.docx` (sección 09 nueva; hay que anexarla al documento original del Momento 1 cuando esté disponible).

## Límites y seguridad

El módulo usa consultas parametrizadas de Prisma y placeholders `$1...$5` en el importador. Las credenciales se cargan por variable de entorno, nunca se incluyen en código. Este prototipo usa usuarios existentes del ERP seleccionables para la demostración y **no implementa autenticación/autorización individual de reseñas**: no exponer el módulo públicamente hasta vincularlo con sesiones y permisos; mantenerlo en entorno académico o restringido. No se validó conexión real porque el ZIP no contiene base ni credenciales.
