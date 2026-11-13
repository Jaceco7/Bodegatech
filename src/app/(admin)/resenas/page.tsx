export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { addReview, updateDiscount } from "./actions";

type SearchProps = {searchParams: Promise<{mensaje?:string; categoria?:string}>};
export default async function ReviewsPage({searchParams}:SearchProps) {
  const {mensaje, categoria} = await searchParams;
  const [users,categories,products,reviews] = await Promise.all([
    prisma.user.findMany({select:{id:true,name:true},orderBy:{name:"asc"}}),
    prisma.category.findMany({where:{active:true},orderBy:{name:"asc"}}),
    prisma.product.findMany({where:{active:true,deletedAt:null},select:{id:true,name:true,categoryId:true,discountPercent:true},orderBy:{name:"asc"}}),
    prisma.review.findMany({take:30,orderBy:{createdAt:"desc"},include:{user:{select:{name:true}},product:{select:{name:true}}}})
  ]);
  const selected = categoria || categories[0]?.id;
  const selectedProducts = products.filter(p=>p.categoryId===selected);
  const ratingGroups = selectedProducts.length ? await prisma.review.groupBy({
    by:["productId"],where:{productId:{in:selectedProducts.map(p=>p.id)}},
    _avg:{rating:true},_count:{rating:true}
  }):[];
  const lookup = new Map(ratingGroups.map(r=>[r.productId,r]));
  const inputStyle="bg-zinc-800 border border-zinc-700 p-2 rounded w-full text-white";
  return <div className="space-y-8 max-w-6xl mx-auto">
    <header><h1 className="text-3xl font-bold">Reseñas y calidad de datos · Momento 2</h1>
    <p className="text-zinc-400 mt-2">Pruebas conectadas directamente a PostgreSQL. Los rechazos se comprueban con restricciones de la base.</p></header>
    {mensaje && <div role="status" className="p-4 rounded bg-blue-950 border border-blue-700">{mensaje}</div>}
    <div className="grid md:grid-cols-2 gap-5">
      <section className="bg-zinc-900 p-5 rounded-xl space-y-3"><h2 className="text-xl font-semibold">1. Registrar reseña / 4. Probar rechazo</h2>
        <form action={addReview} className="space-y-3">
          <label className="block">Usuario<select className={inputStyle} name="userId" required>{users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
          <label className="block">Producto<select className={inputStyle} name="productId" required>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label className="block">Rating (pruebe -1 o 6 para provocar CHECK)<input className={inputStyle} name="rating" type="number" step="1" defaultValue="5" required /></label>
          <label className="block">Comentario<textarea className={inputStyle} name="comment" maxLength={1000} /></label>
          <button disabled={!users.length||!products.length} className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50">Guardar reseña</button>
          {(!users.length||!products.length)&&<p className="text-amber-300 text-sm">Cree al menos un usuario y un producto antes de probar.</p>}
        </form>
      </section>
      <section className="bg-zinc-900 p-5 rounded-xl space-y-3"><h2 className="text-xl font-semibold">3. Actualizar descuento</h2>
        <form action={updateDiscount} className="space-y-3">
          <label className="block">Producto<select className={inputStyle} name="productId" required>{products.map(p=><option key={p.id} value={p.id}>{p.name} ({p.discountPercent}%)</option>)}</select></label>
          <label className="block">Descuento (%)<input className={inputStyle} name="discountPercent" type="number" step="1" defaultValue="10" required /></label>
          <button disabled={!products.length} className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50">Actualizar descuento</button>
        </form><p className="text-sm text-zinc-400">El descuento académico se guarda en discountPercent sin alterar precios históricos de ventas.</p>
      </section>
    </div>
    <section className="bg-zinc-900 p-5 rounded-xl space-y-3"><h2 className="text-xl font-semibold">2. Productos de categoría y rating promedio</h2>
      <form method="GET" className="flex gap-3"><select aria-label="Categoría" name="categoria" className={inputStyle} defaultValue={selected}>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><button className="px-4 py-2 bg-blue-600 rounded">Consultar</button></form>
      <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="text-zinc-400"><th className="p-2">Producto</th><th className="p-2">Promedio (reviews)</th><th className="p-2">Reseñas</th><th className="p-2">Descuento</th></tr></thead>
      <tbody>{selectedProducts.map(p=><tr key={p.id} className="border-t border-zinc-800"><td className="p-2">{p.name}</td><td className="p-2">{lookup.get(p.id)?._avg.rating?.toFixed(2) ?? "Sin reseñas"}</td><td className="p-2">{lookup.get(p.id)?._count.rating ?? 0}</td><td className="p-2">{p.discountPercent}%</td></tr>)}</tbody></table></div>
      {!selectedProducts.length&&<p className="text-zinc-400">No hay productos en esta categoría.</p>}
    </section>
    <section className="bg-zinc-900 p-5 rounded-xl"><h2 className="text-xl font-semibold mb-3">Últimas reseñas</h2>
      {reviews.map(r=><p key={r.id} className="border-b border-zinc-800 py-2">{r.product.name} — {r.rating}/5 — {r.user.name}{r.comment?` · ${r.comment}`:""}</p>)}
      {!reviews.length&&<p className="text-zinc-400">Sin reseñas registradas.</p>}
    </section>
  </div>;
}
