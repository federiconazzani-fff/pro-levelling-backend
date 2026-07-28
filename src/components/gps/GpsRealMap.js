"use client";

import React, { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet default icons
const fixLeafletIcons = () => {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

export default function GpsRealMap({ coordinates = [], initialRegion = null, color = "var(--primary)", strokeWidth = 6 }) {
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const polylineRef = React.useRef(null);
  const markerRef = React.useRef(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    fixLeafletIcons();
    
    let initialCenter = [45.4642, 9.1900]; // Default Duomo
    if (coordinates.length > 0) {
      initialCenter = [coordinates[coordinates.length - 1].lat, coordinates[coordinates.length - 1].lon];
    } else if (initialRegion) {
      initialCenter = [initialRegion.lat, initialRegion.lon];
    }

    // Initialize map
    const map = L.map(mapRef.current, {
      center: initialCenter,
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    // Use Google Maps tiles (standard fallback for compatibility)
    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
    }).addTo(map);

    const line = L.polyline(coordinates.map(c => [c.lat, c.lon]), {
      color: color,
      weight: strokeWidth,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    const m = L.marker(initialCenter).addTo(map);

    mapInstanceRef.current = map;
    polylineRef.current = line;
    markerRef.current = m;

    // Force tile load
    setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && coordinates.length > 0) {
      const lastCoord = coordinates[coordinates.length - 1];
      const newPos = [lastCoord.lat, lastCoord.lon];
      
      polylineRef.current.setLatLngs(coordinates.map(c => [c.lat, c.lon]));
      markerRef.current.setLatLng(newPos);
      mapInstanceRef.current.panTo(newPos, { animate: true });
    }
  }, [coordinates]);

  useEffect(() => {
    if (mapInstanceRef.current && initialRegion && coordinates.length === 0) {
      const pos = [initialRegion.lat, initialRegion.lon];
      mapInstanceRef.current.setView(pos, 16);
      if (markerRef.current) markerRef.current.setLatLng(pos);
    }
  }, [initialRegion, coordinates.length]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: "100%", 
        height: "100%", 
        borderRadius: "24px", 
        overflow: "hidden", 
        border: "2px solid #111",
        zIndex: 1
      }} 
    />
  );
}
