export const API_ENDPOINTS = {
  AUTH: { LOGIN: "/auth/login", REGISTER: "/auth/register", PROFILE: "/auth/profile" },
  USERS: { LIST: "/users", DETAIL: (id) => `/users/${id}` },
  RECORDS: {
    LIST: (type) => `/${type}`,
    YEARS: (type) => `/${type}/years`,
    DETAIL: (type, id) => `/${type}/${id}`,
  },
  DASHBOARD: "/dashboard",
  MAP: "/map",
  GEOCODE: "https://nominatim.openstreetmap.org/search",
};
