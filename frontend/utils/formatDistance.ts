export const formatDistance = (distanceKm?: number | null): string => {
  if (distanceKm == null || !Number.isFinite(distanceKm)) {
    return 'Nearby';
  }

  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }

  return `${distanceKm.toFixed(2)} km`;
};
