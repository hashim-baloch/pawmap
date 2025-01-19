import { useState } from "react";
import PropTypes from "prop-types";

function SearchBox({ onLocationSelect }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchLocation = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching location:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Debounce the search to avoid too many requests
    const timeoutId = setTimeout(() => {
      searchLocation(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleResultClick = (result) => {
    onLocationSelect({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      zoom: 16,
    });
    setSearchQuery(result.display_name);
    setSearchResults([]);
  };

  return (
    <div className="search-container">
      <input
        type="text"
        className="search-input"
        placeholder="Search location..."
        value={searchQuery}
        onChange={handleSearch}
      />
      {searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map((result) => (
            <div
              key={result.place_id}
              className="search-result-item"
              onClick={() => handleResultClick(result)}
            >
              {result.display_name}
            </div>
          ))}
        </div>
      )}
      {isLoading && <div className="search-results">Loading...</div>}
    </div>
  );
}

SearchBox.propTypes = {
  onLocationSelect: PropTypes.func.isRequired,
};

export default SearchBox;
