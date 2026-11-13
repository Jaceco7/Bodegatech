
import { prisma } from "@/lib/prisma";
import { UpdateProductToast } from "./components/update-product-toast";
import { CreateProductForm } from "./components/create-product-form";
import { ProductsTable } from "./components/products-table";

const ITEMS_PER_PAGE = 10;

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    updated?: string;
  }>;
}) {
  const params = await searchParams;

  const query = params.q || "";
  const requestedPage = Number(params.page || "1");

  const where = {
    active: true,
    OR: [
      {
        name: {
          contains: query,
          mode: "insensitive" as const,
        },
      },
      {
        code: {
          contains: query,
          mode: "insensitive" as const,
        },
      },
      {
        brand: {
          contains: query,
          mode: "insensitive" as const,
        },
      },
    ],
  };

  const totalProductos = await prisma.product.count({ where });

  const totalPages = Math.ceil(
    totalProductos / ITEMS_PER_PAGE
  );

  const page = Number.isInteger(requestedPage)
    ? Math.max(1, Math.min(requestedPage, totalPages || 1))
    : 1;

  const [productos, categorias, productosDesactivados, inventario] =
    await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
      }),

      prisma.category.findMany({
        orderBy: {
          name: "asc",
        },
      }),

      prisma.product.count({
        where: {
          active: false,
        },
      }),

      prisma.product.findMany({
        where: {
          active: true,
        },
        select: {
          stock: true,
          minStock: true,
        },
      }),
    ]);

  // PASO 5: AUTOMATIZACIÓN DETERMINÍSTICA
  // Se evalúa el inventario real de PostgreSQL.

  const productosAgotados = inventario.filter(
    (producto) => producto.stock === 0
  ).length;

  const productosStockBajo = inventario.filter(
    (producto) =>
      producto.stock > 0 &&
      producto.stock < producto.minStock
  ).length;

  const productosDisponibles = inventario.filter(
    (producto) =>
      producto.stock > 0 &&
      producto.stock >= producto.minStock
  ).length;

  const queryParams = (targetPage: number) =>
    `/productos?q=${encodeURIComponent(query)}&page=${targetPage}#tabla-productos`;

  return (
    <main className="min-h-screen bg-black p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl">

        {params.updated === "1" && <UpdateProductToast />}

        <h1 className="mb-2 text-4xl font-bold">
          Productos
        </h1>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-zinc-400">
            Total productos: {totalProductos}
          </p>

          <a
            href="/productos/desactivados"
            className="rounded-xl bg-orange-600 px-4 py-2 font-medium transition hover:bg-orange-700"
          >
            Productos Desactivados ({productosDesactivados})
          </a>
        </div>

        {/* PANEL DE INVENTARIO INTELIGENTE */}

        <section className="mb-8 space-y-4">
          <h2 className="text-xl font-bold">
            Control automático de inventario
          </h2>

          <p className="text-sm text-zinc-400">
            Análisis determinístico basado en el stock y
            el mínimo registrado en PostgreSQL.
          </p>

          <div className="grid gap-4 md:grid-cols-3">

            <div className="rounded-xl border border-green-800 bg-green-950/40 p-5">
              <p className="font-medium text-green-300">
                Productos disponibles
              </p>
              <p className="mt-2 text-4xl font-bold">
                {productosDisponibles}
              </p>
            </div>

            <div className="rounded-xl border border-yellow-700 bg-yellow-950/40 p-5">
              <p className="font-medium text-yellow-300">
                Stock bajo
              </p>
              <p className="mt-2 text-4xl font-bold">
                {productosStockBajo}
              </p>
            </div>

            <div className="rounded-xl border border-red-800 bg-red-950/40 p-5">
              <p className="font-medium text-red-300">
                Productos agotados
              </p>
              <p className="mt-2 text-4xl font-bold">
                {productosAgotados}
              </p>
            </div>

          </div>

          {(productosStockBajo > 0 || productosAgotados > 0) && (
            <div
              role="status"
              className="rounded-xl border border-yellow-600 bg-yellow-950/40 p-5"
            >
              <h3 className="mb-2 text-lg font-bold text-yellow-300">
                ⚠️ Alerta automática de inventario
              </h3>

              <p className="text-zinc-200">
                Se detectaron {productosStockBajo} productos
                con stock bajo y {productosAgotados}
                {" "}productos agotados.
              </p>

              <p className="mt-2 text-sm text-zinc-400">
                Se recomienda revisar las existencias
                antes de realizar nuevas compras.
              </p>
            </div>
          )}

          {productosStockBajo === 0 &&
            productosAgotados === 0 && (
              <div
                role="status"
                className="rounded-xl border border-green-700 bg-green-950/30 p-4 text-green-300"
              >
                ✅ No se detectaron productos con inventario
                bajo ni agotado.
              </div>
            )}
        </section>

        <CreateProductForm categorias={categorias} />

        <div id="tabla-productos">
          <ProductsTable productos={productos} />
        </div>

        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">

            {page > 1 && (
              <a
                href={queryParams(page - 1)}
                className="rounded-xl bg-zinc-800 px-4 py-2"
              >
                Anterior
              </a>
            )}

            <span className="rounded-xl bg-blue-600 px-4 py-2">
              Página {page} de {totalPages}
            </span>

            {page < totalPages && (
              <a
                href={queryParams(page + 1)}
                className="rounded-xl bg-zinc-800 px-4 py-2"
              >
                Siguiente
              </a>
            )}

          </div>
        )}

      </div>
    </main>
  );
}
