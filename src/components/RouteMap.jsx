import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './RouteMap.css';

function FollowLivePosition({ livePosition, navigating }) {
  const map = useMap();

  useEffect(() => {
    if (livePosition && navigating) map.setView([livePosition.lat, livePosition.lon], Math.max(map.getZoom(), 17), { animate: true });
  }, [livePosition, navigating, map]);

  return null;
}

function directionIcon(heading) {
  const rotation = heading == null ? 0 : heading;
  return L.divIcon({
    className: 'live-direction-icon',
    html: `<span style="transform: rotate(${rotation}deg)">▲</span>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

export default function RouteMap({ route, origin, destination, livePosition, heading, navigating, showDebug }) {
  if (!route) return null;

  const positions = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
  const center = positions[Math.floor(positions.length / 2)] || [origin.lat, origin.lon];

  return (
    <div className="route-map">
      <MapContainer center={center} zoom={15} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FollowLivePosition livePosition={livePosition} navigating={navigating} />
        <Polyline positions={positions} pathOptions={{ color: '#C1442E', weight: 5, opacity: 0.85 }} />
        <CircleMarker center={[origin.lat, origin.lon]} radius={8} pathOptions={{ color: '#0F2A3D', fillColor: '#F2A93B', fillOpacity: 1 }}>
          <Popup>Aap yahan hain</Popup>
        </CircleMarker>
        {livePosition && (
          <Marker
            center={[livePosition.lat, livePosition.lon]}
            position={[livePosition.lat, livePosition.lon]}
            icon={directionIcon(heading)}
          >
            <Popup>Live position</Popup>
          </Marker>
        )}
        <CircleMarker center={[destination.lat, destination.lon]} radius={8} pathOptions={{ color: '#0F2A3D', fillColor: '#4C8C6B', fillOpacity: 1 }}>
          <Popup>{destination.name}</Popup>
        </CircleMarker>
        {route.steps.map(
          (step) =>
            step.landmark && (
              <CircleMarker
                key={step.index}
                center={[step.landmark.lat, step.landmark.lon]}
                radius={showDebug ? 7 : 5}
                pathOptions={{ color: '#0F2A3D', fillColor: '#FFFCF6', fillOpacity: 1, weight: showDebug ? 3 : 1 }}
              >
                <Popup>
                  <strong>{step.landmark.name}</strong> — chosen
                  <br />
                  score {step.landmark.saliency.total} (category {step.landmark.saliency.categoryScore} +
                  distance {step.landmark.saliency.distanceScore} + prominence {step.landmark.saliency.prominence})
                </Popup>
              </CircleMarker>
            )
        )}
        {showDebug &&
          route.steps.flatMap((step) =>
            (step.rejectedCandidates ?? []).map((candidate) => (
              <CircleMarker
                key={`rejected-${step.index}-${candidate.id}`}
                center={[candidate.lat, candidate.lon]}
                radius={5}
                pathOptions={{ color: '#8a8a8a', fillColor: '#c9c9c9', fillOpacity: 0.85, weight: 1 }}
              >
                <Popup>
                  <strong>{candidate.name}</strong> — not chosen
                  <br />
                  score {candidate.saliency.total} (category {candidate.saliency.categoryScore} +
                  distance {candidate.saliency.distanceScore} + prominence {candidate.saliency.prominence})
                  <br />
                  lost to: {step.landmark?.name} ({step.landmark?.saliency.total})
                </Popup>
              </CircleMarker>
            ))
          )}
        {(route.safetyPoints ?? []).map((point) => (
          <CircleMarker
            key={point.id}
            center={[point.lat, point.lon]}
            radius={6}
            pathOptions={{ color: '#C1442E', fillColor: '#F2A93B', fillOpacity: 1, weight: 2 }}
          >
            <Popup>{point.kind === 'crossing' ? 'Crossing' : point.kind === 'traffic_signals' ? 'Traffic signal' : 'Mapped barrier'}</Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
