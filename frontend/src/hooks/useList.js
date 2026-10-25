import { useCallback, useEffect, useState } from "react";
import { api } from "@/utils/api";
import { request } from "@/utils/request";
import useDebounce from "./useDebounce";

/** List dengan pagination, limit, dan search (debounce 300ms) dari API backend. */
export default function useList(url, extra = {}, enabled = true) {
  const [state, setState] = useState({ rows: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } });
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState({ page: 1, limit: 10, search: "" });
  const search = useDebounce(params.search, 300);
  const extraKey = JSON.stringify(extra);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const r = await request(() => api.get(url, { params: { ...extra, page: params.page, limit: params.limit, search } }));
      setState({ rows: r.data, pagination: r.pagination });
    } catch { /* toast sudah tampil */ } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, extraKey, params.page, params.limit, search, enabled]);

  useEffect(() => { load(); }, [load]);
  const update = (p) => setParams((s) => ({ ...s, ...p }));
  return { ...state, loading, params, update, reload: load };
}
