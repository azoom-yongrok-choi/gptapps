import React from "react";
import { createRoot } from "react-dom/client";
import { Search } from "lucide-react";

function App() {
  const [stationName, setStationName] = React.useState("");
  const [radius, setRadius] = React.useState(1);

  const handleStationChange = (e) => {
    setStationName(e.target.value);
  };

  const handleRadiusChange = (e) => {
    setRadius(e.target.value);
  };

  const handleSearch = async () => {
    const station = stationName.trim();
    console.log({station, radius});
    if (!station || radius === 0) return;
  
    await window.openai.sendFollowUpMessage({
      prompt: `
        You must use the "carparking-search" tool.
        Search for parking near "${station}" station within ${radius} km radius. 
      `,
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const isFormValid = stationName.trim() && radius > 0;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Search Carparking
          </h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Station Name
              </label>
              <input
                type="text"
                value={stationName}
                onChange={handleStationChange}
                onKeyDown={handleKeyDown}
                placeholder="Enter station name..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 text-gray-700 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Radius(km)
              </label>
              <input
                type="number"
                value={radius}
                onChange={handleRadiusChange}
                onKeyDown={handleKeyDown}
                placeholder="Enter radius in km..."
                min="1"
                defaultValue="1"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 text-gray-700 placeholder-gray-400"
              />
            </div>
            
            <button
              onClick={handleSearch}
              disabled={!isFormValid}
              className={`w-full px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
                isFormValid
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-xl active:scale-95 transform cursor-pointer"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <Search size={20} />
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("carparking-search-input-root")).render(<App />);
