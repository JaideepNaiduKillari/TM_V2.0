import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});
import LocateButton from './LocateButton';
import layoutMapImage from './assets/NTPC SIPAT TOWNSHIP UJJWALNAGAR2-1.png';

// FitBounds helper
function FitBounds({ features }) {
  const map = useMap();

  useEffect(() => {
    if (features && features.length > 0) {
      const layer = L.geoJSON({ type: "FeatureCollection", features });
      map.fitBounds(layer.getBounds(), { padding: [20, 20] });
    }
  }, [features, map]);

  return null;
}
// FlyToFeature component to zoom to selected location
function FlyToFeature({ feature }) {
  const map = useMap();

  useEffect(() => {
    if (feature && feature.geometry?.coordinates) {
      const coords = feature.geometry.coordinates;
      console.log('FlyToFeature: Flying to feature', feature.properties?.name, feature.geometry.type, coords);

      // Handle different geometry types
      if (feature.geometry.type === 'Polygon') {
        const bounds = L.geoJSON(feature).getBounds();
        console.log('Flying to Polygon bounds:', bounds);
        map.flyToBounds(bounds, { padding: [20, 20] });
      } else if (feature.geometry.type === 'LineString') {
        const bounds = L.geoJSON(feature).getBounds();
        console.log('Flying to LineString bounds:', bounds);
        map.flyToBounds(bounds, { padding: [20, 20] });
      } else if (feature.geometry.type === 'Point') {
        const [lng, lat] = coords;
        const latlng = L.latLng(lat, lng);
        console.log('Flying to Point:', latlng, 'at zoom 18');
        map.flyTo(latlng, 18);
      }
    } else {
      console.log('FlyToFeature: No valid feature or coordinates', feature);
    }
  }, [feature, map]);

  return null;
}

export default function MapView() {
  const [allFeatures, setAllFeatures] = useState([]);
  const [visibleFeatures, setVisibleFeatures] = useState([]);
  const [otherNames, setOtherNames] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(""); // Track currently selected location
  const [showLayoutMap, setShowLayoutMap] = useState(false); // State to toggle layout map
  const [mapInstance, setMapInstance] = useState(null);

  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/';
    fetch(`${baseUrl}map.geojson`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch map data: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        const all = data.features || [];
        setAllFeatures(all);

        // Show only Boundary initially
        const boundary = all.filter(f => f.properties?.name === 'Boundary');
        setVisibleFeatures(boundary);

        // Extract all location names except boundaries and main boundary
        const excludedFeatures = [
          'Boundary', 'D1 Boundary', 'D2 Boundary', 'D3 Boundary', 'Reservoir Boundary', 
          'A Boundary', 'B Boundary', 'C Boundary'
        ];
        const others = all
          .filter(f => f.properties?.name && !excludedFeatures.includes(f.properties.name))
          .map(f => f.properties.name)
          .sort(); // Sort alphabetically for better UX
        setOtherNames(others);
      })
      .catch((error) => {
        console.error('Error loading map data:', error);
        // You could set an error state here to show a user-friendly message
      });

  }, []);

  const handleSelect = (e) => {
    const name = e.target.value;
    setSelectedLocation(name);
    
    // Always include the main Boundary feature
    const mainBoundary = allFeatures.filter(f => f.properties?.name === 'Boundary');
    
    if (name === "") {
      // If empty selection, show only main boundary
      setVisibleFeatures(mainBoundary);
      setSelectedFeature(null);
      console.log('No selection, showing only main boundary');
    } else {
      // Mapping for features that have specific boundaries
      const mapping = {
        'D1': 'D1 Boundary',
        'D2 61-108': 'D2 Boundary',
        'D2 1-60': 'D2 Boundary',
        'D3': 'D3 Boundary',
        'Reservoir': 'Reservoir Boundary',
        'A': 'A Boundary',
        'B': 'B Boundary',
        'C 25-216': 'C Boundary',
      };

      const match = allFeatures.find(f => f.properties?.name === name);
      
      if (mapping[name]) {
        // For features with specific boundaries, show location + its boundary + main boundary
        const boundary = allFeatures.find(f => f.properties?.name === mapping[name]);
        if (match && boundary) {
          setVisibleFeatures([...mainBoundary, match, boundary]);
          setSelectedFeature(match);
          console.log(`Showing feature: ${name} with its boundary and main boundary`, match, boundary);
        } else if (match) {
          setVisibleFeatures([...mainBoundary, match]);
          setSelectedFeature(match);
          console.log(`Showing feature: ${name} with main boundary (specific boundary not found)`, match);
        }
      } else {
        // For other features, show only the location + main boundary (no specific boundary)
        if (match) {
          setVisibleFeatures([...mainBoundary, match]);
          setSelectedFeature(match);
          console.log(`Showing feature: ${name} with main boundary only`, match);
        }
      }
    }
  };

  const handleClearSelection = () => {
    // Reset dropdown and show only boundary
    setSelectedLocation("");
    const boundary = allFeatures.filter(f => f.properties?.name === 'Boundary');
    setVisibleFeatures(boundary);
    setSelectedFeature(null);
    console.log('Cleared selection, showing only boundary');
  };

  const toggleLayoutMap = () => {
    setShowLayoutMap(!showLayoutMap);
  };

  return (
    <>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, display: 'flex', gap: '10px' }}>
        <select
          value={selectedLocation}
          onChange={handleSelect}
          style={{
            padding: '8px 12px',
            fontSize: '16px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            background: '#fff',
            outline: 'none',
            minWidth: '200px'
          }}
        >
          <option value="">Select a location</option>
          {otherNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        
        <button
          onClick={handleClearSelection}
          style={{
            padding: '8px 12px',
            fontSize: '16px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            background: '#fff',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          Clear
        </button>
        
        <button
          onClick={toggleLayoutMap}
          style={{
            padding: '8px 12px',
            fontSize: '16px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            background: showLayoutMap ? '#007bff' : '#fff',
            color: showLayoutMap ? '#fff' : '#000',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          Layout map
        </button>
      </div>

      {/* Layout Map Modal */}
      {showLayoutMap && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 2000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            boxSizing: 'border-box'
          }}
          onClick={toggleLayoutMap}
        >
          <div 
            style={{
              position: 'relative',
              maxWidth: '95%',
              maxHeight: '95%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={layoutMapImage}
              alt="NTPC SIPAT TOWNSHIP UJJWALNAGAR Layout Map"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                border: '2px solid #fff',
                borderRadius: '8px'
              }}
            />
            <button
              onClick={toggleLayoutMap}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                padding: '8px 12px',
                fontSize: '16px',
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.9)',
                cursor: 'pointer',
                outline: 'none',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <MapContainer
        center={[0, 0]}
        zoom={16}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer 
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
        />
        {visibleFeatures.length > 0 && (
          <>
            <GeoJSON
              key={`geojson-${visibleFeatures.length}-${Date.now()}`}
              data={{ type: "FeatureCollection", features: visibleFeatures }}
              onEachFeature={(feature, layer) => {
                if (feature.properties?.name) {
                  layer.bindPopup(feature.properties.name);
                }
              }}
            />
            {selectedFeature && <FlyToFeature key={`fly-${selectedFeature.properties?.name}-${Date.now()}`} feature={selectedFeature} />}
            <FitBounds features={visibleFeatures} />
          </>
        )}
        <LocateButton />
      </MapContainer>
    </>
  );
}
