import { useMap, Marker, Popup } from 'react-leaflet';
import { useState } from 'react';
import L from 'leaflet';

export default function LocateButton() {
  const [position, setPosition] = useState(null);
  const map = useMap();

  const handleClick = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const latlng = [latitude, longitude];
        setPosition(latlng);
        map.flyTo(latlng, 17);
      },
      () => {
        alert('Unable to retrieve your location.');
      }
    );
  };

  return (
    <>
      <button className="locate-btn" onClick={handleClick}>
        📍
      </button>

      {position && (
        <Marker
          position={position}
          icon={L.icon({
            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
          })}
        >
          <Popup>You are here</Popup>
        </Marker>
      )}
    </>
  );
}
