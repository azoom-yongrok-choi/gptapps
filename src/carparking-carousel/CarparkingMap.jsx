import { useCallback, useMemo, useRef } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { decodeBigQueryDecimal } from "./utils.js";
import Popper from "./Popper.jsx";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY||"";

const DEFAULT_GEO_POINT = { lat: 35.690921, lng: 139.700258 };


export default function CarparkingMap({places=[], selectedPlace, setSelectedPlace, onContactClick}) {
  const mapRef = useRef(null);
  const center = useMemo(() => {
    if(places.length === 0) return DEFAULT_GEO_POINT;
    return { lat: decodeBigQueryDecimal(places[0].lat), lng: decodeBigQueryDecimal(places[0].lng) };
  }, [places]);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });


  const containerStyle = useMemo(
    () => ({ width: "100%", height: "100%", borderRadius: "16px" }),
    []
  );

  const handleMarkerClick = useCallback((place, event) => {
    if (setSelectedPlace) {
      setSelectedPlace(place);
    }
  }, [setSelectedPlace]);

  const handleClosePopper = useCallback(() => {
    if (setSelectedPlace) {
      setSelectedPlace(null);
    }
  }, [setSelectedPlace]);

  const handleMapClick = useCallback(() => {
    handleClosePopper();
  }, [handleClosePopper]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-lg text-gray-700">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={13}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
        }}
        onLoad={(map) => {
          mapRef.current = map;
        }}
        onClick={handleMapClick}
      >
        {places.map((place) => {
          const position = {
            lat: typeof place.lat === 'object' ? decodeBigQueryDecimal(place.lat) : place.lat,
            lng: typeof place.lng === 'object' ? decodeBigQueryDecimal(place.lng) : place.lng,
          };
          return (
            <Marker
              key={place.id}
              position={position}
              title={place.name}
              onClick={(e) => {
                e.stop();
                handleMarkerClick(place, e);
              }}
            />
          );
        })}
      </GoogleMap>

      {selectedPlace && (
        <Popper
          place={selectedPlace}
          map={mapRef.current}
          onClose={handleClosePopper}
          onContactClick={onContactClick}
        />
      )}
    </div>
  );
}
