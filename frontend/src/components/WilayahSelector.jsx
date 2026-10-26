import { useEffect, useState, useRef, useCallback } from "react";
import AsyncSelect from "react-select/async";
import { Check, Globe, Lock, Search } from "lucide-react";
import Field from "./Field";
import { api } from "@/utils/api";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { useAuth } from "@/hooks/useAuth";

// Custom styles for React Select to seamlessly match KASTA design system
const customSelectStyles = {
  container: (base) => ({
    ...base,
    width: "100%",
    minWidth: 0,
  }),
  control: (base, state) => ({
    ...base,
    width: "100%",
    minWidth: 0,
    minHeight: "38px",
    height: "38px",
    borderRadius: "0.5rem",
    borderColor: state.isFocused ? "#8A4B1F" : "#E8DED1",
    backgroundColor: state.isDisabled ? "#F5EFEB" : "#FFFFFF",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(138, 75, 31, 0.2)" : "none",
    "&:hover": {
      borderColor: state.isFocused ? "#8A4B1F" : "#C4B5A5",
    },
    fontSize: "0.875rem",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    transition: "border-color 0.15s, box-shadow 0.15s",
  }),
  valueContainer: (base) => ({
    ...base,
    height: "38px",
    padding: "0 10px",
    display: "flex",
    flexWrap: "nowrap",
    alignItems: "center",
    overflow: "hidden",
    minWidth: 0,
  }),
  placeholder: (base) => ({
    ...base,
    color: "#A89485",
    fontSize: "0.875rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "calc(100% - 12px)",
    margin: 0,
  }),
  singleValue: (base) => ({
    ...base,
    color: "#2C1B10",
    fontWeight: 500,
    fontSize: "0.875rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "calc(100% - 12px)",
    margin: 0,
  }),
  input: (base) => ({
    ...base,
    color: "#2C1B10",
    margin: 0,
    padding: 0,
  }),
  indicatorsContainer: (base) => ({
    ...base,
    height: "38px",
    flexShrink: 0,
  }),
  dropdownIndicator: (base) => ({
    ...base,
    padding: "4px 8px",
    color: "#8A4B1F",
    "&:hover": { color: "#5C3113" },
  }),
  clearIndicator: (base) => ({
    ...base,
    padding: "4px 6px",
    color: "#A89485",
    "&:hover": { color: "#8A4B1F" },
  }),
  indicatorSeparator: (base) => ({
    ...base,
    marginTop: "8px",
    marginBottom: "8px",
    backgroundColor: "#E8DED1",
  }),
  loadingIndicator: (base) => ({
    ...base,
    padding: "4px 8px",
    color: "#8A4B1F",
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 99999,
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "0.75rem",
    boxShadow:
      "0 10px 25px -5px rgba(44, 27, 16, 0.15), 0 8px 10px -6px rgba(44, 27, 16, 0.1)",
    border: "1px solid #E8DED1",
    backgroundColor: "#FFFFFF",
    zIndex: 99999,
    minWidth: "100%",
    width: "100%",
    overflow: "hidden",
  }),
  menuList: (base) => ({
    ...base,
    padding: "6px",
    maxHeight: "220px",
  }),
  option: (base, state) => ({
    ...base,
    borderRadius: "0.375rem",
    margin: "2px 0",
    fontSize: "0.875rem",
    padding: "8px 12px",
    backgroundColor: state.isSelected
      ? "#8A4B1F"
      : state.isFocused
        ? "#FFF8F1"
        : "transparent",
    color: state.isSelected ? "#FFFFFF" : "#4A3324",
    fontWeight: state.isSelected ? 600 : 400,
    cursor: "pointer",
    whiteSpace: "normal",
    wordBreak: "break-word",
    ":active": {
      backgroundColor: "#8A4B1F",
      color: "#FFFFFF",
    },
  }),
  noOptionsMessage: (base) => ({
    ...base,
    fontSize: "0.8125rem",
    color: "#8C7A6B",
    padding: "10px",
  }),
  loadingMessage: (base) => ({
    ...base,
    fontSize: "0.8125rem",
    color: "#8C7A6B",
    padding: "10px",
  }),
};

export default function WilayahSelector({
  values = {},
  onChange,
  lockedToUser = false,
  showDusun = true,
  levels = ["provinsi", "kabupaten", "kecamatan", "desa"],
  layout = "grid",
  columns,
}) {
  const { user, isSuperAdmin } = useAuth();
  const shouldLock = lockedToUser && !isSuperAdmin && !!user?.kabupaten;

  // Selected Option Objects for React Select: { value, label, ... }
  const [selectedProv, setSelectedProv] = useState(null);
  const [selectedReg, setSelectedReg] = useState(null);
  const [selectedDist, setSelectedDist] = useState(null);
  const [selectedVill, setSelectedVill] = useState(null);

  // Key states to force re-render/reload when parent dependency changes
  const [regKey, setRegKey] = useState(0);
  const [distKey, setDistKey] = useState(0);
  const [villKey, setVillKey] = useState(0);

  const isInitialized = useRef(false);

  // Helper: Load Provinces from API with search
  const loadProvinces = useCallback(async (inputValue = "") => {
    try {
      const res = await api.get(API_ENDPOINTS.WILAYAH.PROVINCES, {
        params: { q: inputValue },
      });
      const list = res.data?.data || res.data || [];
      return list.map((p) => ({
        value: p.code,
        label: p.name,
        code: p.code,
        name: p.name,
      }));
    } catch (err) {
      console.error("Gagal load provinsi:", err);
      return [];
    }
  }, []);

  // Helper: Load Regencies from API with search
  const loadRegencies = useCallback(
    async (inputValue = "") => {
      const provCode = selectedProv?.value;
      if (!provCode) return [];
      try {
        const res = await api.get(API_ENDPOINTS.WILAYAH.REGENCIES(provCode), {
          params: { q: inputValue },
        });
        const list = res.data?.data || res.data || [];
        return list.map((r) => ({
          value: r.code,
          label: r.name,
          code: r.code,
          name: r.name,
        }));
      } catch (err) {
        console.error("Gagal load kabupaten:", err);
        return [];
      }
    },
    [selectedProv?.value]
  );

  // Helper: Load Districts from API with search
  const loadDistricts = useCallback(
    async (inputValue = "") => {
      const regCode = selectedReg?.value;
      if (!regCode) return [];
      try {
        const res = await api.get(API_ENDPOINTS.WILAYAH.DISTRICTS(regCode), {
          params: { q: inputValue },
        });
        const list = res.data?.data || res.data || [];
        return list.map((d) => ({
          value: d.code,
          label: d.name,
          code: d.code,
          name: d.name,
        }));
      } catch (err) {
        console.error("Gagal load kecamatan:", err);
        return [];
      }
    },
    [selectedReg?.value]
  );

  // Helper: Load Villages from API with search
  const loadVillages = useCallback(
    async (inputValue = "") => {
      const distCode = selectedDist?.value;
      if (!distCode) return [];
      try {
        const res = await api.get(API_ENDPOINTS.WILAYAH.VILLAGES(distCode), {
          params: { q: inputValue },
        });
        const list = res.data?.data || res.data || [];
        return list.map((v) => ({
          value: v.name,
          label: v.name,
          code: v.code,
          name: v.name,
        }));
      } catch (err) {
        console.error("Gagal load desa:", err);
        return [];
      }
    },
    [selectedDist?.value]
  );

  // Initial synchronization with props and locked user scope
  useEffect(() => {
    if (isInitialized.current) return;

    const targetRegName = shouldLock ? user?.kabupaten : values.kabupaten;
    const targetProvName = shouldLock ? user?.provinsi : values.provinsi;

    if (shouldLock) {
      if (values.provinsi !== user?.provinsi || values.kabupaten !== user?.kabupaten) {
        onChange?.({
          provinsi: user?.provinsi || "",
          kabupaten: user?.kabupaten || "",
        });
      }
    }

    if (targetRegName) {
      api
        .get(API_ENDPOINTS.WILAYAH.LOOKUP, { params: { regencyName: targetRegName } })
        .then(async (res) => {
          const info = res.data?.data || res.data;
          if (info) {
            setSelectedProv({ value: info.provinceCode, label: info.provinceName, name: info.provinceName });
            setSelectedReg({ value: info.code, label: info.name, name: info.name });
            setRegKey((k) => k + 1);

            // Match initial kecamatan if present
            if (values.kecamatan) {
              try {
                const distRes = await api.get(API_ENDPOINTS.WILAYAH.DISTRICTS(info.code), {
                  params: { q: values.kecamatan },
                });
                const distList = distRes.data?.data || distRes.data || [];
                const foundDist = distList.find(
                  (d) => d.name.toLowerCase() === values.kecamatan.toLowerCase()
                );
                if (foundDist) {
                  setSelectedDist({ value: foundDist.code, label: foundDist.name, name: foundDist.name });
                  setDistKey((k) => k + 1);

                  // Match initial desa if present
                  if (values.desa) {
                    setSelectedVill({ value: values.desa, label: values.desa, name: values.desa });
                    setVillKey((k) => k + 1);
                  }
                }
              } catch (err) {
                console.error("Gagal resolve kecamatan:", err);
              }
            }
          }
        })
        .finally(() => {
          isInitialized.current = true;
        });
    } else if (targetProvName) {
      api
        .get(API_ENDPOINTS.WILAYAH.PROVINCES, { params: { q: targetProvName } })
        .then((res) => {
          const list = res.data?.data || res.data || [];
          const p = list.find((x) => x.name.toLowerCase() === targetProvName.toLowerCase());
          if (p) {
            setSelectedProv({ value: p.code, label: p.name, name: p.name });
            setRegKey((k) => k + 1);
          }
        })
        .finally(() => {
          isInitialized.current = true;
        });
    }
  }, [shouldLock, user, values.provinsi, values.kabupaten, values.kecamatan, values.desa, onChange]);

  // Handle Province Select
  const handleProvChange = (opt) => {
    setSelectedProv(opt);
    setSelectedReg(null);
    setSelectedDist(null);
    setSelectedVill(null);

    setRegKey((k) => k + 1);
    setDistKey((k) => k + 1);
    setVillKey((k) => k + 1);

    onChange?.({
      provinsi: opt ? opt.label : "",
      kabupaten: "",
      kecamatan: "",
      desa: "",
    });
  };

  // Handle Regency Select
  const handleRegChange = (opt) => {
    setSelectedReg(opt);
    setSelectedDist(null);
    setSelectedVill(null);

    setDistKey((k) => k + 1);
    setVillKey((k) => k + 1);

    onChange?.({
      kabupaten: opt ? opt.label : "",
      kecamatan: "",
      desa: "",
    });
  };

  // Handle District Select
  const handleDistChange = (opt) => {
    setSelectedDist(opt);
    setSelectedVill(null);

    setVillKey((k) => k + 1);

    onChange?.({
      kecamatan: opt ? opt.label : "",
      desa: "",
    });
  };

  // Handle Village Select
  const handleVillChange = (opt) => {
    setSelectedVill(opt);
    onChange?.({
      desa: opt ? opt.label : "",
    });
  };

  const showProv = levels.includes("provinsi");
  const showReg = levels.includes("kabupaten");
  const showDist = levels.includes("kecamatan");
  const showVill = levels.includes("desa");

  const visibleCount = [showProv, showReg, showDist, showVill].filter(Boolean).length;

  let gridClass = "w-full ";
  if (layout === "vertical") {
    gridClass += "space-y-3";
  } else if (columns === 1) {
    gridClass += "grid grid-cols-1 gap-3";
  } else if (columns === 2 || visibleCount === 2) {
    gridClass += "grid grid-cols-1 sm:grid-cols-2 gap-3";
  } else if (columns === 3 || visibleCount === 3) {
    gridClass += "grid grid-cols-1 sm:grid-cols-3 gap-3";
  } else if (columns === 4) {
    gridClass += "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3";
  } else {
    gridClass += "grid grid-cols-1 sm:grid-cols-2 gap-3";
  }

  return (
    <div className="space-y-3 w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sand-200/80 pb-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-clay-700">
          <Globe size={14} className="text-emerald-600 shrink-0" />
          Data Wilayah Kemendagri RI
        </span>
        {shouldLock ? (
          <span className="flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
            <Lock size={11} className="shrink-0" /> Wilayah Akun: {user?.kabupaten}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] text-clay-500">
            <Search size={11} className="shrink-0" /> Ketik untuk mencari via API
          </span>
        )}
      </div>

      <div className={gridClass}>
        {/* Provinsi */}
        {showProv && (
          <Field label="Provinsi" className="w-full min-w-0">
            {shouldLock ? (
              <div className="flex items-center justify-between rounded-lg border border-sand-200 bg-sand-100/60 px-3 py-2 text-sm text-clay-800 font-medium h-[38px] w-full min-w-0">
                <span className="truncate">{user?.provinsi || values.provinsi || "-"}</span>
                <Lock size={14} className="text-clay-400 shrink-0 ml-2" />
              </div>
            ) : (
              <AsyncSelect
                className="w-full min-w-0"
                cacheOptions
                defaultOptions
                loadOptions={loadProvinces}
                value={selectedProv}
                onChange={handleProvChange}
                placeholder="Cari provinsi..."
                noOptionsMessage={({ inputValue }) =>
                  inputValue ? `Provinsi "${inputValue}" tidak ditemukan` : "Memuat data provinsi..."
                }
                styles={customSelectStyles}
                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                isClearable={!shouldLock}
              />
            )}
          </Field>
        )}

        {/* Kabupaten / Kota */}
        {showReg && (
          <Field label="Kabupaten / Kota" className="w-full min-w-0">
            {shouldLock ? (
              <div className="flex items-center justify-between rounded-lg border border-sand-200 bg-sand-100/60 px-3 py-2 text-sm text-clay-800 font-semibold h-[38px] w-full min-w-0">
                <span className="truncate">{user?.kabupaten || values.kabupaten || "-"}</span>
                <Lock size={14} className="text-clay-400 shrink-0 ml-2" />
              </div>
            ) : (
              <AsyncSelect
                key={`reg-${selectedProv?.value || "empty"}-${regKey}`}
                className="w-full min-w-0"
                cacheOptions
                defaultOptions
                loadOptions={loadRegencies}
                value={selectedReg}
                onChange={handleRegChange}
                placeholder={
                  !selectedProv
                    ? "Pilih provinsi dulu"
                    : "Cari kabupaten/kota..."
                }
                isDisabled={!selectedProv}
                noOptionsMessage={({ inputValue }) =>
                  !selectedProv
                    ? "Pilih provinsi terlebih dahulu"
                    : inputValue
                      ? `Kabupaten "${inputValue}" tidak ditemukan`
                      : "Tidak ada data kabupaten"
                }
                styles={customSelectStyles}
                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                isClearable={!shouldLock}
              />
            )}
          </Field>
        )}

        {/* Kecamatan */}
        {showDist && (
          <Field label="Kecamatan" className="w-full min-w-0">
            <AsyncSelect
              key={`dist-${selectedReg?.value || "empty"}-${distKey}`}
              className="w-full min-w-0"
              cacheOptions
              defaultOptions
              loadOptions={loadDistricts}
              value={selectedDist}
              onChange={handleDistChange}
              placeholder={
                !selectedReg && !shouldLock
                  ? "Pilih kabupaten dulu"
                  : "Cari kecamatan..."
              }
              isDisabled={!selectedReg && !shouldLock}
              noOptionsMessage={({ inputValue }) =>
                !selectedReg && !shouldLock
                  ? "Pilih kabupaten terlebih dahulu"
                  : inputValue
                    ? `Kecamatan "${inputValue}" tidak ditemukan`
                    : "Tidak ada data kecamatan"
              }
              styles={customSelectStyles}
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              isClearable
            />
          </Field>
        )}

        {/* Desa / Kelurahan */}
        {showVill && (
          <Field label="Desa / Kelurahan" className="w-full min-w-0">
            <AsyncSelect
              key={`vill-${selectedDist?.value || "empty"}-${villKey}`}
              className="w-full min-w-0"
              cacheOptions
              defaultOptions
              loadOptions={loadVillages}
              value={selectedVill}
              onChange={handleVillChange}
              placeholder={
                !selectedDist
                  ? "Pilih kecamatan dulu"
                  : "Cari desa/kelurahan..."
              }
              isDisabled={!selectedDist}
              noOptionsMessage={({ inputValue }) =>
                !selectedDist
                  ? "Pilih kecamatan terlebih dahulu"
                  : inputValue
                    ? `Desa/Kelurahan "${inputValue}" tidak ditemukan`
                    : "Tidak ada data desa"
              }
              styles={customSelectStyles}
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              isClearable
            />
          </Field>
        )}
      </div>

      {/* Dusun / Lingkungan */}
      {showDusun && (
        <Field label="Dusun / Lingkungan (Detail Alamat)" className="w-full">
          <input
            className="input text-sm w-full"
            placeholder="Contoh: Dusun Cimekar, RT 02 / RW 05, Blok A"
            value={values.dusun || ""}
            onChange={(e) => onChange?.({ dusun: e.target.value })}
          />
        </Field>
      )}
    </div>
  );
}
