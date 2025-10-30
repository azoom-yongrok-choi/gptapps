import React from "react";
import SpaceInfo from "./SpaceInfo";

export default function PlaceCard({ place }) {
  if (!place) return null;
  
  return (
    <div className="min-w-[280px] select-none max-w-[280px] w-[75vw] sm:w-[280px] self-stretch flex flex-col">
      <div className="mt-3 flex flex-col flex-1 flex-auto">
        <div className="text-base font-medium truncate line-clamp-1">{place.name}</div>
        <div className="text-xs mt-1 text-black/60 flex items-center gap-1">{place.address}</div>
        
        {/* Spaces 정보 */}
        {place.spaces && place.spaces.length > 0 && (
          <div className="mt-3 max-h-[300px] overflow-y-auto">
            {place.spaces.map((space, index) => (
              <SpaceInfo key={space.id || index} space={space} />
            ))}
          </div>
        )}

        <div className="mt-auto pt-3">
          <button
            type="button"
            className="cursor-pointer inline-flex items-center rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 text-sm font-medium hover:opacity-90 active:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
            onClick={() => {
              window.open(`https://carparking.jp/detail/${place.id}`, '_blank');
            }}
          >
            詳細を見る
          </button>
        </div>
      </div>
    </div>
  );
}
