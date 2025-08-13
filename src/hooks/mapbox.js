import { useCallback } from 'react';
import axios from 'axios';

const token = 'pk.eyJ1IjoiYmFvZHV5ZW4xMjMiLCJhIjoiY205NWRnenRmMHh0ZDJpcjQ4a2Y2ZzRhaSJ9.w70EOHntFvOVf6uE2rIahQ';
const geocodeUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
const directionsUrl = 'https://api.mapbox.com/directions/v5/mapbox/driving';

export default function useMapbox() {
  // Lấy tọa độ từ tên địa điểm
  const getCoordinates = useCallback(async (place) => {
    try {
      const response = await axios.get(`${geocodeUrl}/${encodeURIComponent(place)}.json`, {
        params: {
          access_token: token,
          limit: 1,
          country: 'VN',
          language: 'vi',
        },
      });

      const features = response.data.features;
      if (!features || features.length === 0) {
        throw new Error('Địa điểm không được tìm thấy');
      }

      return features[0].center; // [longitude, latitude]
    } catch (err) {
      console.error('Lỗi khi lấy tọa độ:', err);
      return null;
    }
  }, []);

  // Tính khoảng cách và thời gian từ hai địa điểm
  const getDistance = useCallback(async (start, end) => {
    try {
      const [startCoord, endCoord] = await Promise.all([
        getCoordinates(start),
        getCoordinates(end),
      ]);

      if (!startCoord || !endCoord) {
        throw new Error('Không thể xác định tọa độ');
      }

      const coordString = `${startCoord[0]},${startCoord[1]};${endCoord[0]},${endCoord[1]}`;

      const response = await axios.get(`${directionsUrl}/${coordString}`, {
        params: {
          access_token: token,
          geometries: 'geojson',
          overview: 'full',
        },
      });

      const routes = response.data.routes;
      if (!routes || routes.length === 0) {
        throw new Error('Không thể tính toán tuyến đường');
      }

      const distanceMeters = routes[0].distance;
      const durationSeconds = routes[0].duration;

      const km = (distanceMeters / 1000).toFixed(2);
      const hours = (durationSeconds / 3600).toFixed(2);

      return { km, hours };
    } catch (err) {
      console.error('Lỗi khi tính khoảng cách:', err);
      return null;
    }
  }, [getCoordinates]);

  return { getCoordinates, getDistance };
}
