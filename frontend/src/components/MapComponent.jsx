import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
// We need to ensure we don't break if L.Icon.Default is different in this version
try {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
} catch (e) {
    console.warn("Leaflet icon fix failed", e);
}

const center = {
    lat: 28.6139,
    lng: 77.2090
};

// Component to handle map interactions
const MapController = ({ onLocationSelect, setMarkerPosition, markerPosition, readOnly }) => {
    const map = useMap();

    useMapEvents({
        click(e) {
            if (readOnly) return;
            const pos = { lat: e.latlng.lat, lng: e.latlng.lng };
            setMarkerPosition(pos);
            if (onLocationSelect) onLocationSelect(pos);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    // Initial location check (only if not readOnly)
    useEffect(() => {
        if (!readOnly && !markerPosition) {
            map.locate().on("locationfound", function (e) {
                const pos = { lat: e.latlng.lat, lng: e.latlng.lng };
                setMarkerPosition(pos);
                if (onLocationSelect) onLocationSelect(pos);
                map.flyTo(e.latlng, 15);
            });
        }
    }, [map, setMarkerPosition, onLocationSelect, readOnly, markerPosition]);

    return markerPosition === null ? null : (
        <Marker position={markerPosition}></Marker>
    );
};

const LocateButton = () => {
    const map = useMap();

    const handleLocate = (e) => {
        e.preventDefault(); // Prevent form submission if inside a form
        map.locate().once("locationfound", function (e) {
            map.flyTo(e.latlng, 15);
        });
    };

    return (
        <button
            onClick={handleLocate}
            type="button"
            className="btn btn-primary"
            style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 1000,
                padding: '8px 12px',
                fontSize: '0.9rem',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
        >
            📍 Locate Me
        </button>
    );
}


// Component to programmatically move the map when props change
const MapRecenter = ({ centerCoords }) => {
    const map = useMap();
    useEffect(() => {
        if (centerCoords) {
            map.setView(centerCoords, 15);
        }
    }, [centerCoords, map]);
    return null;
};

const MapComponent = ({ onLocationSelect, readOnly = false, markers = [], centerCoords = null }) => {
    const [markerPosition, setMarkerPosition] = useState(centerCoords || null);

    // Update marker directly if centerCoords changes
    useEffect(() => {
        if (centerCoords) {
            setMarkerPosition(centerCoords);
        }
    }, [centerCoords]);

    // Validate coordinates
    const isValidCoord = (c) => c && typeof c.lat === 'number' && typeof c.lng === 'number';
    const effectiveCenter = centerCoords && isValidCoord(centerCoords) ? centerCoords : (isValidCoord(center) ? center : { lat: 0, lng: 0 });

    return (
        <div style={{ height: '400px', width: '100%', position: 'relative', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-inner)' }}>
            <MapContainer center={effectiveCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapRecenter centerCoords={centerCoords} />
                <MapController
                    onLocationSelect={onLocationSelect}
                    setMarkerPosition={setMarkerPosition}
                    markerPosition={markerPosition}
                    readOnly={readOnly}
                />
                {!readOnly && <LocateButton />}

                {/* Extra markers (e.g. Caretakers) */}
                {markers.filter(m => m && typeof m.lat === 'number' && typeof m.lng === 'number').map((m, idx) => (
                    <Marker key={idx} position={m} title={m.title || "Marker"} />
                ))}
            </MapContainer>
        </div>
    );
};

export default React.memo(MapComponent);
