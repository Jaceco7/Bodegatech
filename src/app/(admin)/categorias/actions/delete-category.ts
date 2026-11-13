"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteCategory(id: string) {
  await prisma.category.update({
    where: {
      id,
    },
    data: {
      active: false,
      deletedAt: new Date(),
    },
  });

  revalidatePath("/categorias");
  revalidatePath("/categorias/desactivadas");
}