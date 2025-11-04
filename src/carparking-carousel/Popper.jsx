import { useState, useEffect } from "react";
import { X } from "lucide-react";
import SpaceInfo from "./SpaceInfo.jsx";


export default function Popper({ place, position, map, onClose }) {
  const [pixelPosition, setPixelPosition] = useState(null);

  useEffect(() => {
    if (!map) return;

    const updatePosition = () => {
      const projection = map.getProjection();
      if (!projection) return;

      const worldCoordinate = projection.fromLatLngToPoint(
        new google.maps.LatLng(position.lat, position.lng)
      );
      
      if (!worldCoordinate) return;

      const mapDiv = map.getDiv();
      const mapBounds = map.getBounds();
      
      if (!mapBounds) return;

      const topRight = projection.fromLatLngToPoint(mapBounds.getNorthEast());
      const bottomLeft = projection.fromLatLngToPoint(mapBounds.getSouthWest());

      if (!topRight || !bottomLeft) return;

      const mapWidth = topRight.x - bottomLeft.x;
      const mapHeight = bottomLeft.y - topRight.y;

      const x = (worldCoordinate.x - bottomLeft.x) / mapWidth * mapDiv.offsetWidth;
      const y = (worldCoordinate.y - topRight.y) / mapHeight * mapDiv.offsetHeight;

      setPixelPosition({ x, y: y - 36 });
    };

    updatePosition();
    
    const listener = google.maps.event.addListener(map, 'bounds_changed', updatePosition);
    const zoomListener = google.maps.event.addListener(map, 'zoom_changed', updatePosition);

    return () => {
      google.maps.event.removeListener(listener);
      google.maps.event.removeListener(zoomListener);
    };
  }, [map, position]);

  if (!pixelPosition) return null;

  return (
    <div
      className="absolute z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-h-96 overflow-y-auto"
      style={{
        left: `${pixelPosition.x}px`,
        top: `${pixelPosition.y}px`,
        transform: 'translate(-50%, -100%)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
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
      
      <div className="p-4 space-y-3">
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
      </div>
    </div>
  );
}

