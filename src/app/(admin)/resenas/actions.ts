
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type MessageType = "success" | "error";

function go(message: string, type: MessageType): never {
  const params = new URLSearchParams({
    mensaje: message,
    tipo: type,
  });

  redirect(`/resenas?${params.toString()}`);
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

  if (
    !userId ||
    !productId ||
    ratingInput === null ||
    String(ratingInput).trim() === "" ||
    !Number.isInteger(rating) ||
    comment.length > 1000
  ) {
    go(
      "Revisa los campos del formulario. Selecciona un usuario, un producto y una calificación válida.",
      "error"
    );
  }

  // Se conserva la prueba académica del CHECK:
  // los ratings -1 y 6 llegan a PostgreSQL para
  // demostrar que la base de datos los rechaza.

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

    if (rating < 0 || rating > 5) {
      go(
        "La calificación debe estar entre 0 y 5. No se pudo registrar la reseña.",
        "error"
      );
    }

    go(
      "No fue posible guardar la reseña. Verifica que el usuario y el producto existan.",
      "error"
    );
  }

  revalidatePath("/resenas");

  go("¡Reseña registrada correctamente!", "success");
}

// ==========================================
// 3. ACTUALIZAR DESCUENTO
// ==========================================

export async function updateDiscount(form: FormData) {
  const productId = String(form.get("productId") ?? "").trim();
  const discountInput = form.get("discountPercent");
  const discountPercent = Number(discountInput);

  if (
    !productId ||
    discountInput === null ||
    String(discountInput).trim() === "" ||
    !Number.isInteger(discountPercent)
  ) {
    go(
      "Selecciona un producto e ingresa un porcentaje válido.",
      "error"
    );
  }

  try {
    await prisma.product.update({
      where: { id: productId },
      data: { discountPercent },
    });
  } catch (error) {
    console.error("Error al actualizar el descuento:", error);

    if (discountPercent < 0 || discountPercent > 100) {
      go(
        "El descuento debe estar entre 0% y 100%.",
        "error"
      );
    }

    go(
      "No fue posible actualizar el descuento. Verifica que el producto exista.",
      "error"
    );
  }

  revalidatePath("/resenas");

  go("¡Descuento actualizado correctamente!", "success");
}
