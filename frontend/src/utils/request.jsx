import toast from "react-hot-toast";

/** Jalankan request, tampilkan toast sukses/gagal, kembalikan body response. */
export async function request(fn, successMessage) {
  try {
    const res = await fn();
    if (successMessage) toast.success(successMessage);
    return res.data;
  } catch (e) {
    toast.error(e.response?.data?.message || "Terjadi kesalahan, coba lagi");
    throw e;
  }
}

/** Konfirmasi berbasis toast. Mengembalikan Promise<boolean>. */
export function confirmToast(message, confirmLabel = "Hapus") {
  return new Promise((resolve) => {
    const done = (v, id) => { toast.dismiss(id); resolve(v); };
    toast.custom((t) => (
      <div className="card w-80 p-4 shadow-lg">
        <p className="text-sm">{message}</p>
        <div className="mt-3 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => done(false, t.id)}>Batal</button>
          <button className="btn-danger" onClick={() => done(true, t.id)}>{confirmLabel}</button>
        </div>
      </div>
    ), { duration: Infinity });
  });
}
