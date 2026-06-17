import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { BloodCenter } from '../types';

interface BloodCentersMapProps {
  centers: BloodCenter[];
  selectedCenter: BloodCenter | null;
  onSelectCenter: (center: BloodCenter) => void;
}

const getCenterCoords = (address: string, name: string): [number, number] => {
  const norm = (address + ' ' + name).toLowerCase();
  if (norm.includes('долгиновский') || norm.includes('рнпц трансфузиологии')) return [53.9554, 27.5362]; // Minsk Principal
  if (norm.includes('минск') || norm.includes('6-я гкб') || norm.includes('уральская')) return [53.9006, 27.5590];
  if (norm.includes('лесной') || norm.includes('мокл')) return [53.9984, 27.6975];
  if (norm.includes('боpисов') || norm.includes('борисов')) return [54.2198, 28.5085];
  if (norm.includes('молодечно')) return [54.3129, 26.8576];
  if (norm.includes('солигорск')) return [52.7874, 27.5415];
  if (norm.includes('слуцк')) return [53.0298, 27.5539];
  if (norm.includes('жодино')) return [54.0955, 28.3117];
  if (norm.includes('несвиж')) return [53.2185, 26.6853];
  if (norm.includes('брест')) return [52.0976, 23.7341];
  if (norm.includes('барановичи')) return [53.1317, 26.0125];
  if (norm.includes('пинск')) return [52.1158, 26.1030];
  if (norm.includes('витебск')) return [55.1848, 30.2017];
  if (norm.includes('полоцк')) return [55.4851, 28.7684];
  if (norm.includes('новополоцк')) return [55.5392, 28.6186];
  if (norm.includes('орша')) return [54.5126, 30.4286];
  if (norm.includes('гомель')) return [52.4251, 31.0150];
  if (norm.includes('мозырь')) return [52.0495, 29.2456];
  if (norm.includes('рогачев')) return [53.0911, 30.0537];
  if (norm.includes('речица')) return [52.3639, 30.3951];
  if (norm.includes('светлогорск')) return [52.6335, 29.7423];
  if (norm.includes('гродно')) return [53.6688, 23.8219];
  if (norm.includes('лида')) return [53.8945, 25.2954];
  if (norm.includes('слоним')) return [53.0945, 25.3217];
  if (norm.includes('волковыск')) return [53.1612, 24.4578];
  if (norm.includes('могилев')) return [53.9007, 30.3314];
  if (norm.includes('бобруйск')) return [53.1384, 29.2214];
  if (norm.includes('горки')) return [54.2861, 30.9855];
  
  // Default coordinate (Minsk center)
  return [53.9006, 27.5590];
};

export default function BloodCentersMap({ centers, selectedCenter, onSelectCenter }: BloodCentersMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: number]: L.Marker }>({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet Map centered on Belarus
    const map = L.map(mapContainerRef.current, {
      center: [53.7, 28.0], // Center of Belarus
      zoom: 6,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    mapRef.current = map;

    // Standard high-quality light tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Standard Leaflet marker icon fix
    const DefaultIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute inline-flex h-6 w-6 animate-ping rounded-full bg-red-400 opacity-60"></span>
          <div class="relative flex h-8 w-8 items-center justify-center rounded-full bg-red-600 border border-white shadow-md text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });

    // Populate blood center markers on the map
    const markers: { [key: number]: L.Marker } = {};

    centers.forEach(center => {
      const coords = getCenterCoords(center.address, center.name);
      
      const popupContent = `
        <div style="font-family: sans-serif; padding: 4px; max-width: 250px;">
          <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #ef4444; line-height: 1.3;">${center.name}</h4>
          <p style="margin: 0 0 8px 0; font-size: 11px; color: #475569; font-weight: 550;">${center.address}</p>
          <div style="border-top: 1px solid #f1f5f9; padding-top: 6px; font-size: 11px; color: #475569;">
            <p style="margin: 0 0 4px 0;"><strong style="color: #64748b;">Телефон:</strong> ${center.phone}</p>
            <p style="margin: 0 0 4px 0;"><strong style="color: #64748b;">Часы работы:</strong> ${center.workingHours}</p>
          </div>
        </div>
      `;

      const marker = L.marker(coords, { icon: DefaultIcon })
        .addTo(map)
        .bindPopup(popupContent, { closeButton: false });

      marker.on('click', () => {
        onSelectCenter(center);
      });

      markers[center.id] = marker;
    });

    markersRef.current = markers;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [centers, onSelectCenter]);

  // Handle selected center panning and highlighting
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedCenter) return;

    const coords = getCenterCoords(selectedCenter.address, selectedCenter.name);
    map.setView(coords, 14, { animate: true, duration: 1.2 });

    const marker = markersRef.current[selectedCenter.id];
    if (marker) {
      marker.openPopup();
    }
  }, [selectedCenter]);

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-slate-100 shadow-inner z-10">
      <div ref={mapContainerRef} className="w-full h-full" id="centers-leaflet-map" />
      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-[10px] font-bold text-slate-700 uppercase tracking-widest z-[1000] flex items-center select-none pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse" />
        Интерактивная карта центров крови
      </div>
    </div>
  );
}
