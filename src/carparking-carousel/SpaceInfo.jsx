import React from "react";
import { ROOF_ENUM } from "./utils";

export default function SpaceInfo({ space }) {
  const getPrice = () => {
    if (space.hire !== null) {
      return space.hire.toLocaleString() + '円';
    }
    if (space.rentGroups && Array.isArray(space.rentGroups)) {
      const prices = space.rentGroups.flatMap(group => 
        group.rooms?.map(room => room.wantedRent).filter(rent => rent !== null) || []
      );
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        return minPrice.toLocaleString() + '円';
      }
    }
    return '価格未設定';
  };

  const getLocationText = () => {
    if (space.roofType === ROOF_ENUM.INDOOR) return '屋内';
    if (space.roofType === ROOF_ENUM.OUTDOOR) return '屋外';
    return '不明';
  };

  const getFacilityText = () => {
    return `設備${space.facility}`;
  };

  return (
    <div className="p-3 bg-gray-50 rounded-lg mb-2 text-xs space-y-1">
      <div className="font-semibold text-sm text-gray-900">{space.name}</div>
      <div className="text-blue-600 font-medium">{getPrice()}</div>
      <div className="flex flex-wrap gap-1 mt-2">
        <span className="px-2 py-0.5 bg-white rounded border text-gray-700">
          {getLocationText()}
        </span>
        <span className="px-2 py-0.5 bg-white rounded border text-gray-700">
          {getFacilityText()}
        </span>
      </div>
      <div className="flex flex-wrap gap-1 mt-1">
        {space.isAvailableForLargeCars === 1 && (
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">大型車</span>
        )}
        {space.isAvailableForHighRoofCars === 1 && (
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">ハイルーフ</span>
        )}
        {space.isAvailableForMiddleRoofCars === 1 && (
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">ミドルルーフ</span>
        )}
        {space.isAvailableForTrucks === 1 && (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">トラック可</span>
        )}
        {space.isAvailableForElectricCars === 1 && (
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">EV充電</span>
        )}
      </div>
    </div>
  );
}

