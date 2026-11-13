
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  mensaje?: string;
  tipo?: "success" | "error";
};

export default function MessageModal({
  mensaje,
  tipo = "success",
}: Props) {
  const [open, setOpen] = useState(Boolean(mensaje));
  const router = useRouter();

  useEffect(() => {
    setOpen(Boolean(mensaje));
  }, [mensaje]);

  function closeModal() {
    setOpen(false);

    const url = new URL(window.location.href);
    url.searchParams.delete("mensaje");
    url.searchParams.delete("tipo");

    router.replace(url.pathname + url.search, {
      scroll: false,
    });
  }

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mensaje || !open) return null;

  const isError = tipo === "error";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 text-center shadow-2xl"
      >
        <div className="mb-4 text-5xl">
          {isError ? "❌" : "✅"}
        </div>

        <h2
          id="modal-title"
          className="mb-3 text-2xl font-bold text-white"
        >
          {isError ? "Error en la operación" : "¡Operación exitosa!"}
        </h2>

        <p
          id="modal-description"
          className="mb-6 text-zinc-300"
        >
          {mensaje}
        </p>

        <button
          type="button"
          autoFocus
          onClick={closeModal}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
