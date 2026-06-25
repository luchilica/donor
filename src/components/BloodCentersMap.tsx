import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../LanguageContext.tsx';
import L from 'leaflet';
import { BloodCenter } from '../types';
import { Plus, Minus, Search, X, Locate } from 'lucide-react';

interface BloodCentersMapProps {
  centers: BloodCenter[];
  selectedCenter: BloodCenter | null;
  onSelectCenter: (center: BloodCenter) => void;
}

const getCenterCoords = (address: string, name: string): [number, number] => {
  const norm = (address + ' ' + name).toLowerCase();
  
  // Specific locations/towns first so they don't get matched by parent region/ Minsk defaults
  if (norm.includes('долгиновский') || norm.includes('рнпц трансфузиологии')) return [53.953474, 27.535384]; // Minsk Principal
  if (norm.includes('лесной') || norm.includes('мокл')) return [54.004293, 27.687852]; // MO KBL (Lesnoy)
  if (norm.includes('боровляны') || norm.includes('фрунзенская')) return [53.996731, 27.677983]; // Borovlyany
  if (norm.includes('уральская') || norm.includes('6-я гкб') || norm.includes('трансфузиологический кабинет')) return [53.901198, 27.607887]; // 6th clinical hospital Minsk
  
  // Brest oblast
  if (norm.includes('барановичи')) return [53.117530, 26.038360];
  if (norm.includes('пинск')) return [52.114261, 26.104361];
  if (norm.includes('кобрин')) return [52.211765, 24.324141];
  if (norm.includes('лунинец')) return [52.247246, 26.821312];
  if (norm.includes('берёза') || norm.includes('береза')) return [52.537847, 24.996791];
  if (norm.includes('брест')) return [52.105539, 23.811586];

  // Vitebsk oblast
  if (norm.includes('полоцк')) return [55.483534, 28.776898];
  if (norm.includes('новополоцк')) return [55.541164, 28.619149];
  if (norm.includes('орша')) return [54.510448, 30.419590];
  if (norm.includes('витебск')) return [55.194571, 30.239669];

  // Gomel oblast
  if (norm.includes('мозырь')) return [52.047579, 29.246375];
  if (norm.includes('рогачев') || norm.includes('рогачёв')) return [53.087769, 30.050890];
  if (norm.includes('жлобин')) return [52.898536, 30.030617];
  if (norm.includes('светлогорск')) return [52.623200, 29.745892];
  if (norm.includes('речица')) {
    if (norm.includes('119')) return [52.383959, 30.345548];
    return [52.384018, 30.348711];
  }
  if (norm.includes('калинковичи')) return [52.131346, 29.349982];
  if (norm.includes('добруш')) return [52.413570, 31.321355];
  if (norm.includes('хойники')) return [51.910630, 29.976188];
  if (norm.includes('гомель')) {
    if (norm.includes('ильича') || norm.includes('госпиталь')) return [52.356974, 31.032978];
    return [52.402008, 30.948492];
  }

  // Grodno oblast
  if (norm.includes('лида')) return [53.893444, 25.295131];
  if (norm.includes('слоним')) return [53.077115, 25.387509];
  if (norm.includes('волковыск')) return [53.161959, 24.442766];
  if (norm.includes('сморгонь')) return [54.489142, 26.405664];
  if (norm.includes('гродно')) return [53.645849, 23.857395];

  // Mogilev oblast
  if (norm.includes('бобруйск')) return [53.146986, 29.226595];
  if (norm.includes('горки')) return [54.288119, 30.997413];
  if (norm.includes('кричев')) return [53.689392, 31.709691];
  if (norm.includes('осиповичи')) return [53.294841, 28.646046];
  if (norm.includes('могилев') || norm.includes('могилёв')) return [53.898991, 30.340580];

  // Minsk region towns
  if (norm.includes('боpисов') || norm.includes('борисов')) return [54.223219, 28.521752];
  if (norm.includes('молодечно')) return [54.300156, 26.835877];
  if (norm.includes('солигорск')) return [52.779750, 27.532537];
  if (norm.includes('слуцк')) return [53.017424, 27.556559];
  if (norm.includes('жодино')) return [54.108826, 28.307891];
  if (norm.includes('несвиж') || norm.includes('городея')) return [53.304797, 26.511476];
  if (norm.includes('вилейка')) return [54.485518, 26.910283];

  // Default coordinate (Minsk center)
  return [53.953474, 27.535384];
};

export default function BloodCentersMap({ centers, selectedCenter, onSelectCenter }: BloodCentersMapProps) {
  const { t } = useLanguage();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: number]: L.Marker }>({});
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [locating, setLocating] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search results dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet Map centered on Belarus and strictly restricted to Belarus borders
    const belarusBounds = L.latLngBounds([51.1, 23.1], [56.3, 32.9]);

    const map = L.map(mapContainerRef.current, {
      center: [53.7, 28.0], // Center of Belarus
      zoom: 7,
      minZoom: 7,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
      maxBounds: belarusBounds,
      maxBoundsViscosity: 1.0,
    });

    mapRef.current = map;

    // High quality standard OpenStreetMap localized tiles with Russian labels for all native places
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // Standard Leaflet marker icon fix
    const DefaultIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute inline-flex h-6 w-6 animate-ping rounded-full bg-red-400 opacity-60"></span>
          <div class="relative flex h-8 w-8 items-center justify-center rounded-full bg-red-600 border border-white shadow-md text-white transition-transform hover:scale-110">
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
      
      let needsText = '';
      if (center.bloodNeeds) {
        let lowest = 100;
        let lowestBg = '';
        Object.entries(center.bloodNeeds).forEach(([key, val]) => {
          if (val < lowest) { lowest = val; lowestBg = key; }
        });
        if (lowest < 40) {
          needsText = `<div style="margin-top: 6px; padding: 4px 6px; background-color: #fee2e2; color: #b91c1c; border-radius: 6px; font-size: 10px; font-weight: 700; text-align: center;">🩸 Острый дефицит некоторых групп крови</div>`;
        }
      }

      const popupContent = `
        <div style="font-family: 'Inter', system-ui, sans-serif; padding: 6px; width: 280px;">
          <!-- Badge and country state -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          </div>
          
          <h4 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 800; color: #0f172a; line-height: 1.35; tracking: -0.01em;">
            ${center.name}
          </h4>
          
          <p style="margin: 0 0 10px 0; font-size: 11px; color: #475569; font-weight: 500; line-height: 1.45;">
            📍 ${center.address}
          </p>
          
          <div style="border-top: 1px dotted #e2e8f0; padding-top: 8px; display: flex; flex-direction: column; gap: 5px; font-size: 11px;">
            <div style="display: flex; align-items: center; gap: 6px; color: #334155;">
              <span style="font-size: 12px;">📞</span>
              <strong>Тел:</strong> <span style="font-weight: 600; color: #0f172a;">${center.phone}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; color: #475569;">
              <span style="font-size: 12px;">⏰</span>
              <strong>Время:</strong> <span style="font-weight: 550; color: #334155;">${center.workingHours || '-'}</span>
            </div>
            ${needsText}
          </div>
        </div>
      `;

      const marker = L.marker(coords, { icon: DefaultIcon })
        .addTo(map)
        .bindPopup(popupContent, { 
          closeButton: false,
          offset: [0, -10]
        });

      // Show beautiful popup instantly on hover
      marker.on('mouseover', () => {
        marker.openPopup();
      });

      marker.on('click', () => {
        onSelectCenter(center);
        marker.openPopup();
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

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      alert(t("Геолокация не поддерживается вашим браузером"));
      return;
    }

    if (!window.confirm("Разрешить доступ к вашей геопозиции, чтобы показать вас на карте?")) {
      return;
    }

    const requestGeo = () => {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocating(false);
          const { latitude, longitude } = position.coords;
          const map = mapRef.current;
          if (map) {
            // Remove geographical boundary restrictions to allow viewing locations outside Belarus
            map.setMaxBounds(null);
            map.setView([latitude, longitude], 15, { animate: true, duration: 1.5 });

            // Create custom animated/pulsing marker for user location
            const UserLocationIcon = L.divIcon({
              className: 'custom-leaflet-user-marker',
              html: `
                <div class="relative flex items-center justify-center">
                  <span class="absolute inline-flex h-10 w-10 animate-ping rounded-full bg-blue-400 opacity-60"></span>
                  <div class="relative flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 border-2 border-white shadow-lg text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                </div>
              `,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            });

            // Clean previous user marker if it exists
            if (userMarkerRef.current) {
              userMarkerRef.current.remove();
            }

            // Put a new marker on the map
            const userMarker = L.marker([latitude, longitude], { icon: UserLocationIcon })
              .addTo(map)
              .bindPopup(`
                <div style="font-family: 'Inter', system-ui, sans-serif; padding: 4px; text-align: center;">
                  <strong style="color: #1d4ed8; font-size: 13px;">📍 ${t('Вы находитесь здесь')}</strong>
                  <p style="margin: 4px 0 0 0; font-size: 10px; color: #64748b;">${latitude.toFixed(5)}, ${longitude.toFixed(5)}</p>
                </div>
              `, { closeButton: false });

            userMarkerRef.current = userMarker;
            setTimeout(() => {
              userMarker.openPopup();
            }, 500);
          }
        },
        (error) => {
          setLocating(false);
          console.error("Geolocation error:", error);
          alert(t("Не удалось определить местоположение. Убедитесь, что геопозиция включена в настройках устройства и предоставлен доступ."));
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    // Query Permission API for clean user consent request
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' as any })
        .then((result) => {
          if (result.state === 'prompt') {
            if (window.confirm(t("Для определения вашего местоположения на карте приложению требуется доступ к геолокации. Разрешить?"))) {
              requestGeo();
            }
          } else if (result.state === 'denied') {
            alert(t("Доступ к геолокации запрещен в настройках браузера. Пожалуйста, разрешите доступ для этого сайта."));
          } else {
            requestGeo();
          }
        })
        .catch(() => {
          requestGeo();
        });
    } else {
      requestGeo();
    }
  };

  const filteredSearch = searchQuery.trim() === ''
    ? []
    : centers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.address.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-slate-100 shadow-inner z-10">
      <style dangerouslySetInnerHTML={{ __html: `
        /* Custom elite Leaflet popup styling overrides */
        .leaflet-popup-content-wrapper {
          border-radius: 20px !important;
          box-shadow: 0 12px 30px -4px rgba(15, 23, 42, 0.15), 0 8px 16px -6px rgba(15, 23, 42, 0.1) !important;
          border: 1px solid rgba(241, 245, 249, 1) !important;
          padding: 2px !important;
          overflow: hidden;
          background: #ffffff !important;
        }
        .leaflet-popup-content {
          margin: 12px !important;
          line-height: inherit !important;
        }
        .leaflet-popup-tip {
          background: #ffffff !important;
          box-shadow: 0 10px 20px -5px rgba(15, 23, 42, 0.15) !important;
        }
        .leaflet-popup {
          margin-bottom: 24px !important;
        }
        .leaflet-control-attribution {
          display: none !important;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .6; transform: scale(1.15); }
        }
      ` }} />
      <div ref={mapContainerRef} className="w-full h-full" id="centers-leaflet-map" />
      
      {/* Search Panel */}
      <div ref={searchContainerRef} className="absolute top-3 left-3 right-3 md:right-auto w-auto md:w-80 z-[1000]">
        <div className="relative flex items-center bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/80 shadow-md px-3 py-2 transition-all focus-within:shadow-lg focus-within:border-red-300">
          <Search size={16} className="text-slate-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            placeholder="Поиск города или учреждения..."
            className="w-full bg-transparent text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSearchResults(false);
              }}
              type="button"
              className="text-slate-400 hover:text-slate-600 focus:outline-none ml-1 cursor-pointer flex items-center justify-center"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {showSearchResults && filteredSearch.length > 0 && (
          <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl max-h-56 overflow-y-auto z-[2000] p-1 divide-y divide-slate-100">
            {filteredSearch.map(center => (
              <button
                key={center.id}
                onClick={() => {
                  onSelectCenter(center);
                  setSearchQuery(center.name);
                  setShowSearchResults(false);
                }}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors rounded-lg flex flex-col gap-0.5 focus:outline-none cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-800 line-clamp-1">{center.name}</span>
                <span className="text-[10px] text-slate-500 line-clamp-1">📍 {center.address}</span>
              </button>
            ))}
          </div>
        )}

        {showSearchResults && searchQuery.trim() !== '' && filteredSearch.length === 0 && (
          <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-lg p-3 text-center z-[2000]">
            <span className="text-xs text-slate-500">Ничего не найдено</span>
          </div>
        )}
      </div>

      <div className="absolute bottom-3 left-3 md:bottom-auto md:left-auto md:top-3 md:right-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-[10px] font-bold text-slate-700 uppercase tracking-widest z-[1000] flex items-center select-none pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2 animate-pulse" />
        Карта центров крови РБ
      </div>
      
      {/* Zoom & Location Control Cluster */}
      <div className="absolute top-14 right-3 flex flex-col gap-1.5 z-[1000]">
        <button
          onClick={handleZoomIn}
          type="button"
          className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-50 active:scale-95 text-slate-700 border border-slate-200/80 rounded-xl shadow-md transition-all cursor-pointer font-bold text-lg focus:outline-none min-h-[44px] md:min-h-0"
          title="Приблизить"
        >
          <Plus size={18} className="stroke-[2.5]" />
        </button>
        <button
          onClick={handleZoomOut}
          type="button"
          className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-50 active:scale-95 text-slate-700 border border-slate-200/80 rounded-xl shadow-md transition-all cursor-pointer font-bold text-lg focus:outline-none min-h-[44px] md:min-h-0"
          title="Отдалить"
        >
          <Minus size={18} className="stroke-[2.5]" />
        </button>
        <button
          onClick={handleMyLocation}
          type="button"
          disabled={locating}
          className={`w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-50 active:scale-95 border border-slate-200/80 rounded-xl shadow-md transition-all cursor-pointer focus:outline-none ${locating ? 'animate-pulse' : ''}`}
          title="Мое местоположение"
        >
          <Locate size={18} className={`stroke-[2.5] ${locating ? 'text-red-500' : 'text-slate-700'}`} />
        </button>
      </div>
    </div>
  );
}
