
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Redirige al módulo de reseñas mostrando un mensaje.
function go(message: string): never {
  redirect(`/resenas?mensaje=${encodeURIComponent(message)}`);
}

// ==========================================
// 1. REGISTRAR RESEÑA
// 4. COMPROBAR RECHAZO DE DATOS INVÁLIDOS
// ==========================================

export async function addReview(form: FormData) {
  const userId = String(form.get("userId") ?? "").trim();
  const productId = String(form.get("productId") ?? "").trim();

  const ratingInput = form.get("rating");
  const rating = Number(ratingInput);

  const comment = String(form.get("comment") ?? "").trim();

  // Validar los campos básicos.
  if (
    !userId ||
    !productId ||
    ratingInput === null ||
    String(ratingInput).trim() === "" ||
    !Number.isInteger(rating) ||
    comment.length > 1000
  ) {
    go(
      "Revisa los campos del formulario. " +
      "Selecciona un usuario, un producto y una calificación válida."
    );
  }

  // IMPORTANTE PARA EL MOMENTO 2:
  // No bloqueamos aquí ratings negativos o mayores que 5.
  // Permitimos que PostgreSQL los reciba para demostrar
  // que la restricción CHECK protege la base de datos.

  try {
    await prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        comment: comment || null,
      },
    });
  } catch (error) {
    console.error("Error al registrar la reseña:", error);

    // Mensaje específico para calificaciones fuera de rango.
    if (rating < 0 || rating > 5) {
      go(
        "No se pudo registrar la reseña. " +
        "La calificación debe estar entre 0 y 5. " +
        "La base de datos rechazó el valor ingresado."
      );
    }

    // Mensaje para otros errores de la base de datos.
    go(
      "No fue posible guardar la reseña. " +
      "Verifica que el usuario y el producto seleccionados existan."
    );
  }

  // Se ejecuta únicamente si la reseña se guardó.
  revalidatePath("/resenas");

  go("¡Reseña registrada correctamente!");
}

// ==========================================
// 3. ACTUALIZAR DESCUENTO DEL PRODUCTO
// ==========================================

export async function updateDiscount(form: FormData) {
  const productId = String(form.get("productId") ?? "").trim();

  const discountInput = form.get("discountPercent");
  const discountPercent = Number(discountInput);

  // Validaciones básicas.
  if (
    !productId ||
    discountInput === null ||
    String(discountInput).trim() === "" ||
    !Number.isInteger(discountPercent)
  ) {
    go(
      "No se pudo actualizar el descuento. " +
      "Selecciona un producto e ingresa un porcentaje válido."
    );
  }

  try {
    await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        discountPercent,
      },
    });
  } catch (error) {
    console.error("Error al actualizar el descuento:", error);

    if (discountPercent < 0 || discountPercent > 100) {
      go(
        "No se pudo actualizar el descuento. " +
        "El porcentaje debe estar entre 0% y 100%."
      );
    }

    go(
      "No fue posible actualizar el descuento. " +
      "Verifica que el producto seleccionado exista."
    );
  }

  // Actualizar los datos mostrados en la página.
  revalidatePath("/resenas");

  go("¡Descuento actualizado correctamente!");
}
