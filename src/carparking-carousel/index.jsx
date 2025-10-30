import React from "react";
import { createRoot } from "react-dom/client";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, Filter } from "lucide-react";
import PlaceCard from "./PlaceCard";
import FilterModal from "./FilterModal";
import dummy from "./dummy.json";
import { ROOF_ENUM } from "./utils";

const isDev = true;

function App() {
  const [originalPlaces, setOriginalPlaces] = React.useState([]);
  const [places, setPlaces] = React.useState([]);
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  
  const [filters, setFilters] = React.useState({
    price: { min: -Infinity, max: Infinity },
    size: { large: false, highRoof: false, middleRoof: false },
    location: { indoor: false, outdoor: false, unknown: false },
    facility: { flat: false, mechanical: false },
    other: { allDay: false, truckParking: false, newListing: false, evCharging: false }
  });
  console.log(filters);
  const applyFilters = React.useCallback((data, filterOptions) => {
    return data.filter(place => {
      if (!place.spaces || !Array.isArray(place.spaces) || place.spaces.length === 0) {
        return false;
      }

      const hasMatchingSpace = place.spaces.some(space => {
        // 가격 필터
        let spacePrice = space.hire;
        
        if (spacePrice === null && space.rentGroups && Array.isArray(space.rentGroups)) {
          const prices = space.rentGroups.flatMap(group => 
            group.rooms?.map(room => room.wantedRent).filter(rent => rent !== null) || []
          );
          if (prices.length > 0) {
            spacePrice = Math.min(...prices); // 최저가 사용
          }
        }

        if (spacePrice !== null) {
          if (filterOptions.price.min !== -Infinity && spacePrice < filterOptions.price.min) {
            return false;
          }
          if (filterOptions.price.max !== Infinity && spacePrice > filterOptions.price.max) {
            return false;
          }
        }

        const sizeFilters = filterOptions.size;
        const hasSizeFilter = sizeFilters.large || sizeFilters.highRoof || sizeFilters.middleRoof;
        if (hasSizeFilter) {
          const matchesSize = 
            (sizeFilters.large && space.isAvailableForLargeCars === 1) ||
            (sizeFilters.highRoof && space.isAvailableForHighRoofCars === 1) ||
            (sizeFilters.middleRoof && space.isAvailableForMiddleRoofCars === 1);
          if (!matchesSize) return false;
        }

        const locationFilters = filterOptions.location;
        const hasLocationFilter = locationFilters.indoor || locationFilters.outdoor || locationFilters.unknown;
        if (hasLocationFilter) {
          const matchesLocation = 
            (locationFilters.indoor && space.roofType === ROOF_ENUM.INDOOR) ||
            (locationFilters.outdoor && space.roofType === ROOF_ENUM.OUTDOOR) ||
            (locationFilters.unknown && space.roofType !== ROOF_ENUM.INDOOR && space.roofType !== ROOF_ENUM.OUTDOOR);
          if (!matchesLocation) return false;
        }

        const otherFilters = filterOptions.other;
        
        if (otherFilters.truckParking && space.isAvailableForTrucks !== 1) {
          return false;
        }
        
        if (otherFilters.evCharging && space.isAvailableForElectricCars !== 1) {
          return false;
        }

        return true;

        // todo: check facility value
        // todo: check newListing value
        // todo: check allDay value
      });

      if (!hasMatchingSpace) return false;


      return true;
    });
  }, []);

  React.useEffect(() => {
    const loadData = () => {
      if (isDev) {
        setOriginalPlaces(dummy);
        setPlaces(dummy);
        return;
      }

      const toolOutput = window.openai?.toolOutput;
      
      if (toolOutput?.parkings) {
        setOriginalPlaces(toolOutput.parkings);
        setPlaces(toolOutput.parkings);
      }
    };

    loadData();

    const handleSetGlobals = (event) => {
      if (event.detail?.globals?.toolOutput) {
        loadData();
      }
    };

    window.addEventListener("openai:set_globals", handleSetGlobals);

    return () => {
      window.removeEventListener("openai:set_globals", handleSetGlobals);
    };
  }, []);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    loop: false,
    containScroll: "trimSnaps",
    slidesToScroll: "auto",
    dragFree: false,
  });
  const [canPrev, setCanPrev] = React.useState(false);
  const [canNext, setCanNext] = React.useState(false);

  const handleApplyFilters = () => {
    const filtered = applyFilters(originalPlaces, filters);
    setPlaces(filtered);
    setIsFilterOpen(false);
  };

  const handleCloseFilter = () => {
    setIsFilterOpen(false);
  };

  React.useEffect(() => {
    if (!emblaApi) return;
    const updateButtons = () => {
      setCanPrev(emblaApi.canScrollPrev());
      setCanNext(emblaApi.canScrollNext());
    };
    updateButtons();
    emblaApi.on("select", updateButtons);
    emblaApi.on("reInit", updateButtons);
    return () => {
      emblaApi.off("select", updateButtons);
      emblaApi.off("reInit", updateButtons);
    };
  }, [emblaApi]);

  return (
    <div className="antialiased relative w-full text-black bg-white p-4">
      <div className="flex">
        <button
          onClick={() => setIsFilterOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
          type="button"
        >
          <Filter className="w-4 h-4" />
          条件を指定して絞り込む
        </button>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 max-sm:mx-5 items-stretch">
          {places.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      </div>
      {/* Edge gradients */}
      <div
        aria-hidden
        className={
          "pointer-events-none absolute inset-y-0 left-0 w-3 z-[5] transition-opacity duration-200 " +
          (canPrev ? "opacity-100" : "opacity-0")
        }
      >
        <div
          className="h-full w-full border-l border-black/15 bg-gradient-to-r from-black/10 to-transparent"
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, white 30%, white 70%, transparent 100%)",
            maskImage:
              "linear-gradient(to bottom, transparent 0%, white 30%, white 70%, transparent 100%)",
          }}
        />
      </div>
      <div
        aria-hidden
        className={
          "pointer-events-none absolute inset-y-0 right-0 w-3 z-[5] transition-opacity duration-200 " +
          (canNext ? "opacity-100" : "opacity-0")
        }
      >
        <div
          className="h-full w-full border-r border-black/15 bg-gradient-to-l from-black/10 to-transparent"
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, white 30%, white 70%, transparent 100%)",
            maskImage:
              "linear-gradient(to bottom, transparent 0%, white 30%, white 70%, transparent 100%)",
          }}
        />
      </div>
      {canPrev && (
        <button
          aria-label="Previous"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 inline-flex items-center justify-center h-8 w-8 rounded-full bg-white text-black shadow-lg ring ring-black/5 hover:bg-white cursor-pointer"
          onClick={() => emblaApi && emblaApi.scrollPrev()}
          type="button"
        >
          <ArrowLeft
            strokeWidth={1.5}
            className="h-4.5 w-4.5"
            aria-hidden="true"
          />
        </button>
      )}
      {canNext && (
        <button
          aria-label="Next"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 inline-flex items-center justify-center h-8 w-8 rounded-full bg-white text-black shadow-lg ring ring-black/5 hover:bg-white cursor-pointer"
          onClick={() => emblaApi && emblaApi.scrollNext()}
          type="button"
        >
          <ArrowRight
            strokeWidth={1.5}
            className="h-4.5 w-4.5"
            aria-hidden="true"
          />
        </button>
      )}

      <FilterModal
        isOpen={isFilterOpen}
        onClose={handleCloseFilter}
        onApply={handleApplyFilters}
        filters={filters}
        setFilters={setFilters}
      />
    </div>
  );
}

createRoot(document.getElementById("carparking-carousel-root")).render(<App />);
