import React from "react";

export default function PlaceCard({ place }) {
  if (!place) return null;
  
  return (
    <div className="min-w-[220px] select-none max-w-[220px] w-[65vw] sm:w-[220px] self-stretch flex flex-col">
      <div className="mt-3 flex flex-col flex-1 flex-auto">
        <div className="text-base font-medium truncate line-clamp-1">{place.name}</div>
        <div className="text-xs mt-1 text-black/60 flex items-center gap-1">{place.address}</div>
        {place.spaceUpdatedAt ? (
          <div className="text-sm mt-2 text-black/80 flex-auto">
            {place.spaceUpdatedAt}
          </div>
        ) : null}
        <div className="text-sm mt-2 text-black/80 flex-auto">{`canSublease: ${place.canSublease}`}</div>
        <div className="mt-5">
          <button
            type="button"
            className="cursor-pointer inline-flex items-center rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 text-sm font-medium hover:opacity-90 active:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              window.open(`https://carparking.jp/detail/${place.id}`, '_blank');
            }}
          >
            Apply Form
          </button>
        </div>
      </div>
    </div>
  );
}
