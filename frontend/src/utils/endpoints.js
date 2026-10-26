export const API_ENDPOINTS = {
  AUTH: { LOGIN: "/auth/login", REGISTER: "/auth/register", PROFILE: "/auth/profile" },
  USERS: {
    LIST: "/users",
    DETAIL: (id) => `/users/${id}`,
    CHECK_ADMIN: "/users/check-admin",
  },
  WILAYAH: {
    PROVINCES: "/wilayah/provinces",
    REGENCIES: (provCode) => `/wilayah/regencies/${provCode}`,
    DISTRICTS: (regCode) => `/wilayah/districts/${regCode}`,
    VILLAGES: (distCode) => `/wilayah/villages/${distCode}`,
    ALL_REGENCIES: "/wilayah/all-regencies",
    LOOKUP: "/wilayah/lookup",
  },
  RECORDS: {
    LIST: (type) => `/${type}`,
    YEARS: (type) => `/${type}/years`,
    DETAIL: (type, id) => `/${type}/${id}`,
    EXPORT_DATA: (type) => `/${type}/export-data`,
    BULK_IMPORT: (type) => `/${type}/bulk-import`,
  },
  DASHBOARD: "/dashboard",
  MAP: "/map",
  GEOCODE: "https://nominatim.openstreetmap.org/search",
};
