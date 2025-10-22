import type { Parking, RentGroup, Space, VehicleDimensions } from "./type.js";
import { format } from "date-fns";
import { enrichRoomWithAvailableTerms } from "./add-available-terms.js";
import { addSizeSuitabilityToSpace } from "./add-size-suitability.js";

function hasVehicleDimensions(vehicleDimensions?: VehicleDimensions): boolean {
  return !!(
    vehicleDimensions &&
    (vehicleDimensions.length ||
      vehicleDimensions.width ||
      vehicleDimensions.height ||
      vehicleDimensions.weight)
  );
}

/**
 * RentGroup を拡張する
 */
export function enrichRentGroup(canSublease: boolean, currentDate: string) {
  return (rentGroup: RentGroup) => ({
    ...rentGroup,
    rooms: rentGroup.rooms.map(
      enrichRoomWithAvailableTerms(canSublease, currentDate)
    ),
  });
}

/**
 * Space を拡張する
 */
export function enrichSpace(
  canSublease: boolean,
  vehicleDimensions?: VehicleDimensions,
  currentDate?: string
) {
  return (space: Space) => {
    const baseSpace = hasVehicleDimensions(vehicleDimensions)
      ? addSizeSuitabilityToSpace(space, vehicleDimensions!)
      : space;

    return {
      ...baseSpace,
      rentGroups: space.rentGroups.map(
        enrichRentGroup(canSublease, currentDate!)
      ),
    };
  };
}

/**
 * Parking を拡張する
 */
export function enrichParking(
  vehicleDimensions?: VehicleDimensions,
  currentDate?: string
) {
  return (parking: Parking) => ({
    ...parking,
    spaces: parking.spaces.map(
      enrichSpace(parking.canSublease, vehicleDimensions, currentDate)
    ),
  });
}

export function enrichParkings(
  vehicleDimensions?: VehicleDimensions,
  currentDate?: string
) {
  return (parkings: Parking[]): Parking[] => {
    const effectiveCurrentDate =
      currentDate ?? format(new Date(), "yyyy-MM-dd");

    return parkings.map(enrichParking(vehicleDimensions, effectiveCurrentDate));
  };
}
