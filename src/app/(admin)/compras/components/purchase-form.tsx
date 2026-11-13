"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ProductPicker from "./product-picker";
import ProviderPicker from "./provider-picker";


type Product = {
  id: string;
  code: string;
  name: string;
  stock: number;
};

type Provider = {
  id: string;
  name: string;
};

type PurchaseItem = {
  id: number;
  productId: string;
  productLabel: string;
  quantity: string;
  costPrice: string;
};

type Props = {
  productos: Product[];
  proveedores: Provider[];
  action: (formData: FormData) => Promise<void>;
};

export default function PurchaseForm({
  productos,
  proveedores,
  action,
}: Props) {
  const [items, setItems] = useState<PurchaseItem[]>([
    {
      id: Date.now(),
      productId: "",
      productLabel: "",
      quantity: "",
      costPrice: "",
    },
  ]);

  const router = useRouter();
  const [selectedProvider, setSelectedProvider] =
    useState<Provider | null>(null);

  const total = items.reduce(
    (acc, item) =>
      acc +
      (Number(item.quantity) || 0) *
      (Number(item.costPrice) || 0),
    0
  );

  async function handleSubmit(
    formData: FormData
  ) {
    await action(formData);

    toast.success(
      "Compra registrada correctamente"
    );

    setItems([
      {
        id: Date.now(),
        productId: "",
        productLabel: "",
        quantity: "",
        costPrice: "",
      },
    ]);

    router.refresh();
  }

  const handleProductChange = (
    index: number,
    value: string
  ) => {
    const producto = productos.find(
      (p) =>
        `${p.code} - ${p.name}` === value
    );

    setItems((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
            ...row,
            productLabel: value,
            productId: producto?.id || "",
          }
          : row
      )
    );
  };

  return (
    <form
      action={handleSubmit}
      className="bg-zinc-900 p-6 rounded-xl mb-10"
    >
      <div className="grid md:grid-cols-1 gap-4 mb-6">
        <div>
          <label className="block mb-2 text-sm font-medium text-zinc-300">
            Proveedor
          </label>

          <ProviderPicker
            providers={proveedores}
            onSelect={(provider) =>
              setSelectedProvider(provider)
            }
          />

          <input
            type="hidden"
            name="providerId"
            value={selectedProvider?.id || ""}
          />

          {selectedProvider && (
            <div className="mt-2 p-3 bg-zinc-800 rounded">
              <p className="font-semibold text-green-400">
                Proveedor seleccionado
              </p>

              <p>{selectedProvider.name}</p>
            </div>
          )}
        </div>
      </div>

      {items.map((item, index) => (

        <div
          key={item.id}
          className="grid md:grid-cols-4 gap-4 mb-6"
        >
          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              Producto
            </label>

            
            <ProductPicker
              products={productos}
              onSelect={(product) => {
                setItems((prev) =>
                  prev.map((row, i) =>
                    i === index
                      ? {
                        ...row,
                        productId: product.id,
                        productLabel: `${product.code} - ${product.name}`,
                      }
                      : row
                  )
                );
              }}
            />

            <input
              type="hidden"
              name="productId"
              value={item.productId}
            />

            <div className="mt-2 p-3 bg-zinc-800 rounded">
              <span className="text-green-400 font-semibold">
                Seleccionado:
              </span>{" "}
              {item.productLabel || "Sin producto"}
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              Cantidad
            </label>

            <input
              name="quantity"
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) =>
                setItems((prev) =>
                  prev.map((row, i) =>
                    i === index
                      ? {
                        ...row,
                        quantity: e.target.value,
                      }
                      : row
                  )
                )
              }
              className="w-full p-3 rounded bg-zinc-800"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              Costo Unitario
            </label>

            <input
              name="costPrice"
              type="number"
              min="0.01"
              step="0.01"
              value={item.costPrice}
              onChange={(e) =>
                setItems((prev) =>
                  prev.map((row, i) =>
                    i === index
                      ? {
                        ...row,
                        costPrice: e.target.value,
                      }
                      : row
                  )
                )
              }
              className="w-full p-3 rounded bg-zinc-800"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              Acción
            </label>

            <button
              type="button"
              onClick={() => {
                if (items.length === 1) {
                  toast.error(
                    "Debe existir al menos un producto"
                  );
                  return;
                }

                setItems(
                  items.filter((_, i) => i !== index)
                );
              }}
              className="w-full bg-red-600 rounded p-3"
            >
              ✕ Eliminar
            </button>
          </div>
          

        </div>
      ))}


      <div className="bg-zinc-800 rounded-xl p-4 mt-6 mb-4">
        <p className="text-zinc-400">
          Productos agregados: {items.length}
        </p>

        <p className="text-2xl font-bold text-green-400">
          Total compra: $
          {total.toLocaleString()}
        </p>
      </div>

      <div className="flex gap-4 mt-4">
        <button
          type="button"
          onClick={() =>
            setItems([
              ...items,
              {
                id: Date.now(),
                productId: "",
                productLabel: "",
                quantity: "",
                costPrice: "",
              },
            ])
          }
          className="bg-green-600 px-5 py-3 rounded"
        >
          + Agregar Producto
        </button>

        <button
          type="submit"
          className="bg-blue-600 px-5 py-3 rounded"
        >
          Registrar Compra
        </button>
      </div>
    </form>
  );
}