export async function getGeocode(address: string) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("Google Maps API key is not set in environment variables");
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${apiKey}`
    );
    const data = await response.json();
    if (data.status === "OK") {
      const location = data.results[0].geometry.location;
      return location;
    } else {
      throw new Error("Geocoding failed: " + data.status);
    }
  } catch (error) {
    console.error("Geocoding failed: ", error);
    throw new Error("Geocoding failed: " + error);
  }
}
