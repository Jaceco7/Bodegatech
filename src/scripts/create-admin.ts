
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;

  if (!email || !adminPassword) {
    throw new Error(
      "Debes configurar ADMIN_EMAIL y ADMIN_INITIAL_PASSWORD en .env"
    );
  }

  if (adminPassword.length < 12) {
    throw new Error(
      "La contraseña debe tener al menos 12 caracteres."
    );
  }

  // Comprobar si el administrador ya existe.
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    console.log(
      "El usuario ya existe. No se modificó su contraseña."
    );
    return;
  }

  // Generar hash con sal aleatoria utilizando bcrypt.
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.create({
    data: {
      name: "Administrador",
      email,
      password: passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Administrador creado correctamente.");
}

main()
  .catch((error) => {
    console.error("Error al crear el administrador:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
