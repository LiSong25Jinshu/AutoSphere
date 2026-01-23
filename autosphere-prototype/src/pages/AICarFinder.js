import React, { useState } from "react";
import "./AICarFinder.css";

// Sample car data
const carData = [
  { id: 1, name: "Toyota Camry", year: 2022, price: 25000, image: "/images/camry.png" },
  { id: 2, name: "Honda Civic", year: 2021, price: 22000, image: "/images/civic.png" },
  { id: 3, name: "Ford Mustang", year: 2023, price: 35000, image: "/images/mustang.png" },
  { id: 4, name: "Tesla Model 3", year: 2023, price: 42000, image: "/images/model3.png" },
];

function AICarFinder() {
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [filteredCars, setFilteredCars] = useState(carData);

  const handleSearch = () => {
    const filtered = carData.filter((car) => {
      return (
        car.name.toLowerCase().includes(search.toLowerCase()) &&
        (brandFilter ? car.name.toLowerCase().includes(brandFilter.toLowerCase()) : true) &&
        (yearFilter ? car.year.toString() === yearFilter : true)
      );
    });
    setFilteredCars(filtered);
  };

  return (
    <div className="ai-car-finder-page">
      <h1>AI Car Finder</h1>
      <p className="subtitle">Find your ideal car with AI-powered recommendations</p>

      <div className="filters">
        <input
          type="text"
          placeholder="Search by model..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="text"
          placeholder="Filter by brand..."
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
        />
        <input
          type="number"
          placeholder="Filter by year..."
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
        />
        <button className="btn primary" onClick={handleSearch}>
          Search
        </button>
      </div>

      <div className="car-grid">
        {filteredCars.length === 0 ? (
          <p className="no-results">No cars found.</p>
        ) : (
          filteredCars.map((car) => (
            <div key={car.id} className="car-card">
              <img src={car.image} alt={car.name} />
              <div className="car-info">
                <h3>{car.name}</h3>
                <p>Year: {car.year}</p>
                <p>Price: ${car.price.toLocaleString()}</p>
              </div>
              <button className="btn primary">View Details</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AICarFinder;
