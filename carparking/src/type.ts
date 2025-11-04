export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface VehicleDimensions {
  length?: {
    min: number;
    max: number;
  } | null;
  width?: {
    min: number;
    max: number;
  } | null;
  height?: {
    min: number;
    max: number;
  } | null;
  weight?: {
    min: number;
    max: number;
  } | null;
}

export interface LoadParams {
  geoCircle: GeoPoint & {
    radiusKm: number;
  };
  vehicleDimensions?: VehicleDimensions;
}

export interface LoadResult {
  dataSetId: string;
  totalCount: number;
  subleaseCount: number;
  brokerageCount: number;
  parkings: Parking[];
}

export interface Term {
  startDate: string;
  endDate: string;
}

export interface ContractTerm {
  status: number;
  startDate: string;
  endDate: string | null;
}

export interface AvailableTerm {
  startDate: string;
  endDate: string | null;
}

export interface Room {
  id: number;
  wantedRent: number;
  lowerLimitRent: number;
  roomNo: number;
  roomName: string;
  status: number;
  contractType: number;
  contractStartDate: string;
  contractEndDate: string | null;
  contractTerms: ContractTerm[];
  noReferralTerms: Term[];
  availableTerms?: AvailableTerm[];
}

export interface RentGroup {
  rentKey: string;
  rooms: Room[];
}

export interface Space {
  id: number;
  name: string;
  hire: number | null;
  totalEmptyRooms: number;
  isAvailableForSmallCars: boolean | number; // -1 appears in view
  isAvailableForMiddleCars: boolean | number;
  isAvailableForLargeCars: boolean | number;
  isAvailableForMiddleRoofCars: boolean | number;
  isAvailableForHighRoofCars: boolean | number;
  isAvailableForElectricCars: boolean | number;
  isAvailableForTrucks: boolean | number;
  roofType: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  weight: number | null;
  groundHeight?: number | null;
  tireWidth: number | null;
  sizeSuitability: number | null;
  rentGroups: RentGroup[];
}

export interface ParkingInfo {
  /* basic metadata */
  id: number;
  name: string;
  canSublease: boolean;
  address: string | null;
  distanceKm: number;

  /* aggregated spaces (COALESCE of sublease / brokerage) */
  spaces: Space[];
}

export interface Parking extends ParkingInfo, GeoPoint {}

export interface Context {
  session?: Record<string, any>;
}
