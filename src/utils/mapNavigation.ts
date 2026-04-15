export interface MapNavigationPayload {
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export function buildTencentMapUrl(payload: MapNavigationPayload): string {
  const params = new URLSearchParams({
    type: 'marker',
    is_search: '1',
  });

  const address = (payload.address || '').trim();
  if (address) {
    params.set('addr', address);
  }

  const hasLatitude = typeof payload.latitude === 'number' && Number.isFinite(payload.latitude);
  const hasLongitude = typeof payload.longitude === 'number' && Number.isFinite(payload.longitude);
  if (hasLatitude && hasLongitude) {
    const lat = String(payload.latitude);
    const lng = String(payload.longitude);
    params.set('lat', lat);
    params.set('lng', lng);
    params.set('coord', `${lat},${lng}`);
  }

  return `https://map.qq.com/m/index/map?${params.toString()}`;
}

