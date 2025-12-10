# File: tools.py
# Tools per l'agente di viaggio

import requests
from langchain.tools import tool
from typing import Optional

# Headers per Nominatim (richiede User-Agent valido)
HEADERS = {
    'User-Agent': 'MasterAI25-TravelWorkshop/1.0 (https://github.com/masterai25; contact@masterai.dev)',
    'Accept-Language': 'en'
}

print("✅ Tools module loaded")

# Continua in tools.py

@tool
def search_location(query: str) -> str:
    """
    Search for a location and get its coordinates and details.
    Use this to find GPS coordinates of cities, landmarks, addresses.
    
    Args:
        query: Name of the place to search (e.g., 'Tokyo', 'Eiffel Tower')
    
    Returns:
        Location details including coordinates, country, and display name.
    """
    import time
    time.sleep(1)  # Rispetta rate limit di Nominatim
    
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        'q': query,
        'format': 'json',
        'limit': 1,
        'addressdetails': 1
    }
    
    try:
        response = requests.get(url, params=params, headers=HEADERS, timeout=10)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        return f"Error searching location: {e}"
    
    if not data:
        return f"Location '{query}' not found."
    
    loc = data[0]
    return f"""Location: {loc.get('display_name')}
Latitude: {loc.get('lat')}
Longitude: {loc.get('lon')}
Type: {loc.get('type')}"""

# Continua in tools.py

@tool
def get_weather(latitude: float, longitude: float) -> str:
    """
    Get current weather for a location using coordinates.
    Use search_location first to get coordinates, then call this.
    
    Args:
        latitude: GPS latitude (e.g., 35.6762 for Tokyo)
        longitude: GPS longitude (e.g., 139.6503 for Tokyo)
    
    Returns:
        Current weather including temperature, humidity, wind speed.
    """
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        'latitude': latitude,
        'longitude': longitude,
        'current': 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
        'timezone': 'auto'
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        return f"Error getting weather: {e}"
    
    current = data.get('current', {})
    return f"""Current Weather:
Temperature: {current.get('temperature_2m')}°C
Humidity: {current.get('relative_humidity_2m')}%
Wind Speed: {current.get('wind_speed_10m')} km/h
Timezone: {data.get('timezone')}"""

# Continua in tools.py

@tool
def get_forecast(latitude: float, longitude: float, days: int = 7) -> str:
    """
    Get weather forecast for upcoming days.
    
    Args:
        latitude: GPS latitude
        longitude: GPS longitude
        days: Number of days to forecast (1-16, default 7)
    
    Returns:
        Daily forecast with max/min temperatures and weather conditions.
    """
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        'latitude': latitude,
        'longitude': longitude,
        'daily': 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
        'timezone': 'auto',
        'forecast_days': min(days, 16)
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        return f"Error getting forecast: {e}"
    
    daily = data.get('daily', {})
    dates = daily.get('time', [])
    max_temps = daily.get('temperature_2m_max', [])
    min_temps = daily.get('temperature_2m_min', [])
    rain_prob = daily.get('precipitation_probability_max', [])
    
    forecast_lines = ["Weather Forecast:"]
    for i in range(min(len(dates), days)):
        forecast_lines.append(
            f"{dates[i]}: {min_temps[i]}°C - {max_temps[i]}°C, Rain: {rain_prob[i]}%"
        )
    
    return "\n".join(forecast_lines)

# Continua in tools.py

@tool
def get_country_info(country_name: str) -> str:
    """
    Get detailed information about a country.
    
    Args:
        country_name: Name of the country (e.g., 'Japan', 'Italy', 'France')
    
    Returns:
        Country details: capital, currency, languages, population, timezone.
    """
    url = f"https://restcountries.com/v3.1/name/{country_name}"
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            return f"Country '{country_name}' not found."
        data = response.json()[0]
    except Exception as e:
        return f"Error getting country info: {e}"
    
    # Estrai info principali
    currencies = list(data.get('currencies', {}).keys())
    languages = list(data.get('languages', {}).values())
    
    return f"""Country: {data.get('name', {}).get('common')}
Capital: {', '.join(data.get('capital', ['N/A']))}
Region: {data.get('region')} / {data.get('subregion')}
Population: {data.get('population'):,}
Currencies: {', '.join(currencies)}
Languages: {', '.join(languages)}
Timezones: {', '.join(data.get('timezones', []))}
Driving side: {data.get('car', {}).get('side', 'N/A')}"""

# Continua in tools.py

@tool
def convert_currency(from_currency: str, to_currency: str, amount: float) -> str:
    """
    Convert an amount from one currency to another using real-time rates.
    
    Args:
        from_currency: Source currency code (e.g., 'EUR', 'USD')
        to_currency: Target currency code (e.g., 'JPY', 'GBP')
        amount: Amount to convert
    
    Returns:
        Converted amount with exchange rate.
    """
    url = f"https://open.er-api.com/v6/latest/{from_currency.upper()}"
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        return f"Error converting currency: {e}"
    
    if data.get('result') != 'success':
        return f"Currency conversion failed. Check currency codes."
    
    rates = data.get('rates', {})
    to_upper = to_currency.upper()
    
    if to_upper not in rates:
        return f"Currency '{to_currency}' not found."
    
    rate = rates[to_upper]
    converted = amount * rate
    
    return f"""{amount} {from_currency.upper()} = {converted:.2f} {to_upper}
Exchange rate: 1 {from_currency.upper()} = {rate:.4f} {to_upper}
Last updated: {data.get('time_last_update_utc', 'N/A')}"""

# Fine di tools.py - export lista tools

# Lista di tutti i tools disponibili
ALL_TOOLS = [
    search_location,
    get_weather,
    get_forecast,
    get_country_info,
    convert_currency
]

# Test rapido dei tools (opzionale)
if __name__ == "__main__":
    print("\n🧪 Testing tools...")
    
    # Test search_location
    result = search_location.invoke("Rome, Italy")
    print(f"\n📍 search_location('Rome'):")
    print(result)
    
    # Test get_weather
    result = get_weather.invoke({"latitude": 41.9028, "longitude": 12.4964})
    print(f"\n🌤️ get_weather(Rome coords):")
    print(result)
    
    print("\n✅ All tools working!")