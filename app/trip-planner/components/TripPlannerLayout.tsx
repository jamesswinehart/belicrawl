"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import MapView from "./MapView";
import CitySearchSheet from "./CitySearchSheet";
import NeighborhoodSheet from "./NeighborhoodSheet";
import ResultsSheet from "./ResultsSheet";
import { Viewport, Bounds, Restaurant } from "@/lib/types";
import { buildGoogleMapsWalkingUrl } from "@/lib/utils";

type Step = "city" | "neighborhood" | "results";

export default function TripPlannerLayout() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("city");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [viewport, setViewport] = useState<Viewport>({
    latitude: 40.3573, // Default to Princeton
    longitude: -74.6553,
    zoom: 12,
  });
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] =
    useState<string | undefined>();
  const [routeStops, setRouteStops] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [showCrawlSummary, setShowCrawlSummary] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Try to get user's location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // Validate coordinates before setting viewport
          if (
            !isNaN(lat) &&
            !isNaN(lng) &&
            isFinite(lat) &&
            isFinite(lng) &&
            lat >= -90 &&
            lat <= 90 &&
            lng >= -180 &&
            lng <= 180
          ) {
            setViewport({
              latitude: lat,
              longitude: lng,
              zoom: 12,
            });
          }
        },
        () => {
          // Use default (Princeton) if geolocation fails
        }
      );
    }
  }, []);

  const handleCitySelect = (cityName: string, center: [number, number]) => {
    setSelectedCity(cityName);

    // Validate coordinates before setting viewport
    const lng = center[0];
    const lat = center[1];

    if (
      !isNaN(lat) &&
      !isNaN(lng) &&
      isFinite(lat) &&
      isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      setViewport({
        latitude: lat,
        longitude: lng,
        zoom: 12,
      });
      setStep("neighborhood");
    } else {
      console.error("Invalid coordinates for city:", cityName, center);
    }
  };

  const handleNeighborhoodSelect = async () => {
    if (!selectedCity) return;

    // If bounds aren't set yet, calculate from current viewport
    const currentBounds = bounds || {
      minLat: viewport.latitude - 0.01,
      minLng: viewport.longitude - 0.01,
      maxLat: viewport.latitude + 0.01,
      maxLng: viewport.longitude + 0.01,
    };

    setIsLoading(true);
    try {
      const response = await fetch("/api/restaurants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          city: selectedCity,
          bounds: currentBounds,
          center: {
            lat: viewport.latitude,
            lng: viewport.longitude,
          },
        }),
      });

      const data = await response.json();
      setRestaurants(data.restaurants || []);
      setStep("results");
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestaurantClick = (restaurant: Restaurant) => {
    setSelectedRestaurantId(restaurant.id);

    // Offset the map center slightly south so the selected pin appears
    // a bit higher on the screen (more map visible "below" the pin).
    const OFFSET_DEGREES = 0.004; // ~.11km in latitude; tweak as needed

    setViewport({
      latitude: restaurant.lat - OFFSET_DEGREES,
      longitude: restaurant.lng,
      zoom: 15,
    });
  };

  const handleSearchAgain = async () => {
    if (!selectedCity) return;

    // Use current bounds or calculate from viewport
    const currentBounds = bounds || {
      minLat: viewport.latitude - 0.01,
      minLng: viewport.longitude - 0.01,
      maxLat: viewport.latitude + 0.01,
      maxLng: viewport.longitude + 0.01,
    };

    setIsLoading(true);
    try {
      const response = await fetch("/api/restaurants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          city: selectedCity,
          bounds: currentBounds,
          center: {
            lat: viewport.latitude,
            lng: viewport.longitude,
          },
        }),
      });

      const data = await response.json();
      setRestaurants(data.restaurants || []);
      // Reset selected restaurant when searching again
      setSelectedRestaurantId(undefined);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBoundsChange = (newBounds: Bounds) => {
    setBounds(newBounds);
  };

  const toggleRouteStop = (restaurant: Restaurant) => {
    setRouteStops((prev) => {
      const exists = prev.find((r) => r.id === restaurant.id);
      if (exists) {
        return prev.filter((r) => r.id !== restaurant.id);
      }
      return [...prev, restaurant];
    });
  };

  const removeRouteStop = (restaurantId: string) => {
    setRouteStops((prev) => prev.filter((r) => r.id !== restaurantId));
  };

  const clearRouteStops = () => {
    setRouteStops([]);
  };

  const handleCreateCrawl = () => {
    if (routeStops.length === 0) return;
    setShowCrawlSummary(true);
  };

  const handleCopyCrawlMessage = async () => {
    if (routeStops.length === 0) return;
    const list = routeStops.map((r, idx) => `${idx + 1}. ${r.name}`).join("\n");
    const mapsUrl = buildGoogleMapsWalkingUrl(
      routeStops.map((r) => ({ name: r.name, city: r.city }))
    );
    const message =
      `Let's go on a Beli Crawl!\n\n${list}` +
      (mapsUrl ? `\n\n${mapsUrl}` : "");

    try {
      await navigator.clipboard.writeText(message);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // Swallow errors silently for now; could be enhanced with a toast
      setShareCopied(false);
    }
  };

  const handleOpenGoogleMaps = () => {
    if (routeStops.length === 0) return;
    const url = buildGoogleMapsWalkingUrl(routeStops);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleStartOver = () => {
    setShowCrawlSummary(false);
    setStep("city");
    setSelectedCity("");
    setRestaurants([]);
    setRouteStops([]);
    setSelectedRestaurantId(undefined);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Map */}
      <div className="absolute inset-0">
        <MapView
          viewport={viewport}
          onViewportChange={setViewport}
          onBoundsChange={handleBoundsChange}
          restaurants={step === "results" ? restaurants : []}
          selectedRestaurantId={selectedRestaurantId}
          onRestaurantClick={handleRestaurantClick}
        />
      </div>

      {/* Help / Tutorial button (top-left, only on city step) */}
      {step === "city" && !showCrawlSummary && (
        <button
          onClick={() => setIsTutorialOpen(true)}
          className="absolute top-4 left-4 z-20 bg-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-gray-50 active:bg-gray-100 min-h-[44px]"
          style={{
            top: "max(1rem, env(safe-area-inset-top, 0px) + 1rem)",
            left: "max(1rem, env(safe-area-inset-left, 0px) + 1rem)",
            boxShadow: "0 4px 16px 4px rgba(0, 0, 0, 0.25)",
          }}
        >
          <span className="text-sm font-bold text-gray-800">?</span>
        </button>
      )}

      {/* Back button (only show when not on city step and not in crawl summary) */}
      {step !== "city" && !showCrawlSummary && (
        <button
          onClick={() => {
            if (step === "results") {
              setStep("neighborhood");
              setRestaurants([]);
              setSelectedRestaurantId(undefined);
            } else if (step === "neighborhood") {
              setStep("city");
              setSelectedCity("");
            }
          }}
          className="absolute top-4 left-4 z-20 bg-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-gray-50 active:bg-gray-100 min-h-[44px]"
          style={{
            top: "max(1rem, env(safe-area-inset-top, 0px) + 1rem)",
            left: "max(1rem, env(safe-area-inset-left, 0px) + 1rem)",
            boxShadow: "0 4px 16px 4px rgba(0, 0, 0, 0.25)",
          }}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-20 z-30 flex items-center justify-center">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg">
            <p className="text-gray-700">Finding restaurants...</p>
          </div>
        </div>
      )}

      {/* Step sheets (hidden when showing crawl summary) */}
      {!showCrawlSummary && (
        <>
          {step === "city" && <CitySearchSheet onCitySelect={handleCitySelect} />}
          {step === "neighborhood" && (
            <NeighborhoodSheet
              cityName={selectedCity}
              onSelect={handleNeighborhoodSelect}
            />
          )}
          {step === "results" && (
            <ResultsSheet
              restaurants={restaurants}
              selectedRestaurantId={selectedRestaurantId}
              onRestaurantClick={handleRestaurantClick}
              onSearchAgain={handleSearchAgain}
              routeStops={routeStops}
              onToggleRouteStop={toggleRouteStop}
              onRemoveRouteStop={removeRouteStop}
              onClearRouteStops={clearRouteStops}
              onCreateCrawl={handleCreateCrawl}
            />
          )}
        </>
      )}

      {/* Tutorial overlay */}
      {isTutorialOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-40">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  What is Beli Crawl?
                </h2>
              </div>
              <button
                onClick={() => setIsTutorialOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close tutorial"
              >
                ✕
              </button>
            </div>

            <ol className="space-y-3 text-sm text-gray-800 mb-4 list-decimal list-inside">
              <li>
                <span className="font-semibold">Pick a city</span> from the search box or nearby list (only Princeton and New York supported for now!)
              </li>
              <li>
                <span className="font-semibold">Zoom the map</span> to the neighborhood or part of town you’d like to visit
              </li>
              <li>
                <span className="font-semibold">Peruse restaurants</span> to build your crawl. See bookmarks and recommendations (based on James’s Beli data for now!)
              </li>
              <li>
                <span className="font-semibold">Create a crawl</span> to plan a trip with friends and receive a Google Maps route!
              </li>
            </ol>

            <button
              onClick={() => setIsTutorialOpen(false)}
              className="w-full mt-2 py-2.5 rounded-lg bg-beli-teal text-white text-sm font-medium hover:bg-beli-teal-dark active:bg-beli-teal-dark"
            >
              Let’s go!
            </button>

            <div className="mt-4 text-center space-y-1">
              <p className="text-sm text-gray-600">
                To the Beli team, for creating my favorite app, and Alistair, for joining me on Beli Crawls past and future.
              </p>
              <p className="text-sm text-gray-600">
                Created with love by{" "}
                <a
                  href="https://www.jamesswineh.art/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-beli-teal"
                >
                  James Swinehart
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Full-page crawl summary */}
      {showCrawlSummary && (
        <div className="absolute inset-0 z-40 bg-white flex flex-col">
          {/* Back button (same position as other top-left buttons, but without shadow) */}
          <button
            onClick={() => setShowCrawlSummary(false)}
            className="absolute top-4 left-4 z-50 bg-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-gray-50 active:bg-gray-100 min-h-[44px]"
            style={{
              top: 'max(1rem, env(safe-area-inset-top, 0px) + 1rem)',
              left: 'max(1rem, env(safe-area-inset-left, 0px) + 1rem)',
            }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Title block */}
          <div className="px-6 mt-16 mb-2 flex flex-col items-center">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-beli-teal text-center">
              Your Beli Crawl is Complete!
            </h2>
          </div>

          <div className="flex-1 px-6 overflow-y-auto">
            {routeStops.length === 0 ? (
              <p className="text-center text-gray-500 mt-8">
                No stops in your crawl yet.
              </p>
            ) : (
              <ul className="divide-y divide-gray-200 max-w-md mx-auto">
                {routeStops.map((stop, idx) => (
                  <li
                    key={stop.id}
                    className="flex items-center justify-between py-4 text-sm"
                  >
                    <div className="flex flex-col">
                      <span className="text-gray-900 font-medium">
                        {idx + 1}. {stop.name}
                      </span>
                      {(stop.price || stop.cuisine) && (
                        <span className="text-xs text-gray-600 mt-0.5">
                          {[
                            stop.price || undefined,
                            stop.cuisine || undefined,
                          ]
                            .filter(Boolean)
                            .join(" • ")}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => removeRouteStop(stop.id)}
                      className="text-gray-400 hover:text-red-500 text-lg leading-none px-2"
                      aria-label="Remove from crawl"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="px-6 pb-8 pt-4 space-y-3 max-w-md mx-auto w-full">
            <button
              onClick={handleOpenGoogleMaps}
              disabled={routeStops.length === 0}
              className={`w-full py-3 rounded-lg text-sm font-semibold text-white ${
                routeStops.length === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-beli-teal hover:bg-beli-teal-dark active:bg-beli-teal-dark"
              }`}
            >
              Create a Route
            </button>

            <button
              onClick={handleCopyCrawlMessage}
              disabled={routeStops.length === 0}
              className={`w-full py-3 rounded-lg text-sm font-semibold text-white ${
                routeStops.length === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-beli-teal hover:bg-beli-teal-dark active:bg-beli-teal-dark"
              }`}
            >
              {shareCopied ? "Copied to clipboard!" : "Share with Friends"}
            </button>

            <button
              onClick={handleStartOver}
              className="w-full py-3 rounded-lg text-sm font-semibold border border-beli-teal text-beli-teal hover:bg-beli-teal hover:text-white"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
