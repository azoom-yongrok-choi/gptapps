import { useState, useEffect, useRef } from "react";
import { X, Mail } from "lucide-react";
import SpaceInfo from "./SpaceInfo.jsx";

export default function Popper({ place, map, onClose, onContactClick }) {
  const [containerHeight, setContainerHeight] = useState(400);
  const popperRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    const updateHeight = () => {
      const mapDiv = map.getDiv();
      if (mapDiv && mapDiv.parentElement) {
        const parentHeight = mapDiv.parentElement.offsetHeight;
        setContainerHeight(parentHeight);
      }
    };

    updateHeight();
    
    const listener = google.maps.event.addListener(map, 'bounds_changed', updateHeight);
    const zoomListener = google.maps.event.addListener(map, 'zoom_changed', updateHeight);

    // ResizeObserver를 사용하여 부모 컨테이너 높이 변경 감지
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    const mapDiv = map.getDiv();
    if (mapDiv && mapDiv.parentElement) {
      resizeObserver.observe(mapDiv.parentElement);
    }

    return () => {
      google.maps.event.removeListener(listener);
      google.maps.event.removeListener(zoomListener);
      resizeObserver.disconnect();
    };
  }, [map]);

  return (
    <div
      ref={popperRef}
      className="absolute right-4 top-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-80 overflow-hidden flex flex-col"
      style={{
        maxHeight: `${containerHeight - 32}px`, // 상하 여백 16px씩
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-lg text-gray-800">{place.name}</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          type="button"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {place.address && (
          <div>
            <p className="text-sm text-gray-500 mb-1">住所</p>
            <p className="text-sm text-gray-800">{place.address}</p>
          </div>
        )}

        {place.spaces && place.spaces.length > 0 && (
          <div>
            <p className="text-sm text-gray-500 mb-2">スペース詳細</p>
            <div className="space-y-2">
              {place.spaces.map((space) => (
                <SpaceInfo key={space.id} space={space} />
              ))}
            </div>
          </div>
        )}

        {onContactClick && (
          <div className="pt-2">
            <button
              type="button"
              className="cursor-pointer inline-flex items-center rounded-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-medium hover:opacity-90 active:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
              onClick={(e) => {
                e.stopPropagation();
                onContactClick(place);
              }}
            >
              <Mail className="w-4 h-4 mr-2" />
              <span>お問い合わせ</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

