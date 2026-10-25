import L from "leaflet";

// Set official default icon served directly from /public
export const DefaultIcon = L.icon({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Override default marker icon globally
L.Marker.prototype.options.icon = DefaultIcon;
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.imagePath = "/";

export const TILES = {
  standard: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap kontributor",
    label: "Peta Standar",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Esri, Maxar, Earthstar Geographics",
    label: "Citra Satelit",
  },
};

export const TILE = TILES.standard.url;

// Generate crisp SVG pin as data URI for L.icon (native <img> element, zero asset load failure)
const makeSvgPin = (fillColor) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 36' width='32' height='48'><defs><filter id='s' x='-20%' y='-10%' width='140%' height='130%'><feDropShadow dx='0' dy='3' stdDeviation='2' flood-color='#000000' flood-opacity='0.4'/></filter></defs><path filter='url(#s)' fill='${fillColor}' stroke='#ffffff' stroke-width='1.5' stroke-linejoin='round' d='M12 1C6.2 1 1.5 5.8 1.5 11.6c0 8.2 10.5 21.4 10.5 21.4s10.5-13.2 10.5-21.4C22.5 5.8 17.8 1 12 1z'/><circle cx='12' cy='11.5' r='4' fill='#ffffff'/></svg>`;
  return L.icon({
    iconUrl: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
    iconSize: [30, 44],
    iconAnchor: [15, 42],
    popupAnchor: [0, -38],
  });
};

export const PINS = {
  picker: makeSvgPin("#DC2626"),    // Merah untuk titik penanda picker
  sengketa: makeSvgPin("#8A4B1F"),  // Cokelat bata untuk sengketa
  perkara: makeSvgPin("#1E40AF"),   // Biru dongker untuk perkara
};

export const createPinIcon = (type = "picker") => PINS[type] || PINS.picker;

export default L;



