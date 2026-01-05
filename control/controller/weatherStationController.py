import requests


class WeatherStationController:
    def __init__(self):
        self.base_url = "https://api.wunderground.com/v2/pws/observations/current"
        
    def updateData(self, api_key: str, station_id: str) -> dict | None:
        params = {
            'stationId': station_id,
            'format': 'json',
            'units': 'm',
            'apiKey': api_key
        }
        
        try:
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if data and 'observations' in data and len(data['observations']) > 0:
                print(f"WS API: Successfully fetched data for {station_id}.")
                return data['observations'][0] 
            else:
                print(f"WS API Warning: No observation data found for {station_id}.")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f'WS API Error fetching data for {station_id}: {e}')
            return None
        except ValueError as e:
             print(f'WS API Error decoding JSON for {station_id}: {e}. Response: {response.text[:200]}...')
             return None
        except Exception as e:
            print(f'WS API Unexpected error for {station_id}: {e}')
            return None