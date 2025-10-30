import React, { useState, useEffect } from 'react';

const LocationCapture = ({ onLocationChange, disabled = false }) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        setLocation(newLocation);
        onLocationChange(newLocation);
        setIsLoading(false);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setError(errorMessage);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const clearLocation = () => {
    setLocation(null);
    onLocationChange(null);
    setError(null);
  };

  return (
    <div style={{ 
      background: 'rgba(15, 23, 42, 0.7)', 
      padding: '16px', 
      borderRadius: '12px', 
      border: '1px solid rgba(148, 163, 184, 0.2)',
      marginTop: '12px'
    }}>
      <h4 style={{ color: '#e2e8f0', marginBottom: '12px', fontSize: '16px' }}>
        📍 Location Lock Settings
      </h4>
      
      {location ? (
        <div style={{ color: '#10b981', marginBottom: '12px' }}>
          <div>✅ Location captured successfully!</div>
          <div style={{ fontSize: '14px', marginTop: '4px', color: '#6b7280' }}>
            Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
            <br />
            Accuracy: ±{Math.round(location.accuracy)}m
          </div>
        </div>
      ) : (
        <div style={{ color: '#6b7280', marginBottom: '12px' }}>
          No location captured yet
        </div>
      )}

      {error && (
        <div style={{ color: '#ef4444', marginBottom: '12px', fontSize: '14px' }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={disabled || isLoading}
          style={{
            background: location 
              ? 'linear-gradient(135deg, #10b981, #059669)' 
              : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
            opacity: disabled || isLoading ? 0.6 : 1,
            transition: 'all 0.2s ease'
          }}
        >
          {isLoading ? '🔄 Getting Location...' : '📍 Capture Location'}
        </button>

        {location && (
          <button
            type="button"
            onClick={clearLocation}
            disabled={disabled}
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            🗑️ Clear Location
          </button>
        )}
      </div>

      <div style={{ 
        marginTop: '12px', 
        fontSize: '12px', 
        color: '#6b7280',
        lineHeight: '1.4'
      }}>
        <strong>How it works:</strong> When enabled, this document can only be verified when you're physically at the captured location. Perfect for land deeds, exam cards, or location-specific documents.
      </div>
    </div>
  );
};

export default LocationCapture;
