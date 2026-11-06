import { useCallback, useEffect, useState } from "react";
import "./LiveWeather.css";

const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast" +
  "?latitude=22.8456&longitude=89.5403" +
  "&current=temperature_2m,relative_humidity_2m," +
  "apparent_temperature,precipitation,rain,showers," +
  "weather_code,wind_speed_10m" +
  "&hourly=precipitation_probability" +
  "&temperature_unit=celsius" +
  "&wind_speed_unit=kmh" +
  "&precipitation_unit=mm" +
  "&timezone=Asia%2FDhaka";

function formatNumber(value, digits = 1) {
  return Number.isFinite(Number(value))
    ? Number(value).toFixed(digits)
    : "--";
}

// Convert Open-Meteo weather information into
// one of the atmospheric options in Risk Prediction.
function getAtmosphericState(weather) {
  const code = Number(weather?.weather_code);
  const precipitation = Number(weather?.precipitation ?? 0);
  const rain = Number(weather?.rain ?? 0);
  const showers = Number(weather?.showers ?? 0);

  if (
    precipitation > 0 ||
    rain > 0 ||
    showers > 0 ||
    [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code)
  ) {
    if (
      precipitation >= 7 ||
      rain >= 7 ||
      showers >= 7 ||
      [65, 82, 95, 96, 99].includes(code)
    ) {
      return "Monsoon Downpour";
    }

    return "Heavy Rain";
  }

  if ([45, 48].includes(code)) {
    return "Foggy";
  }

  if ([1, 2, 3].includes(code)) {
    return "Cloudy";
  }

  return "Clear Sky";
}

function getRainStatus(weather, probability) {
  const precipitation = Number(weather?.precipitation ?? 0);
  const rain = Number(weather?.rain ?? 0);
  const showers = Number(weather?.showers ?? 0);

  if (precipitation > 0 || rain > 0 || showers > 0) {
    return "Rain reported";
  }

  if (probability !== null && probability >= 60) {
    return "Rain likely";
  }

  return "No rain reported";
}

export default function LiveWeather() {
  const [weather, setWeather] = useState(null);
  const [rainProbability, setRainProbability] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadWeather = useCallback(async () => {
    try {
      setError("");

      const response = await fetch(WEATHER_URL);

      if (!response.ok) {
        throw new Error("Weather service is temporarily unavailable.");
      }

      const data = await response.json();

      if (!data.current) {
        throw new Error("Current weather data is unavailable.");
      }

      const currentWeather = data.current;
      const atmosphericState = getAtmosphericState(currentWeather);

      setWeather(currentWeather);

      // Save weather for the Risk Prediction page.
      localStorage.setItem(
        "saferoute_weather_state",
        JSON.stringify({
          atmosphere: atmosphericState,
          precipitation: currentWeather.precipitation ?? 0,
          rain: currentWeather.rain ?? 0,
          weatherCode: currentWeather.weather_code,
          weatherTime: currentWeather.time,
          updatedAt: new Date().toISOString(),
        })
      );

      const currentTime = new Date(currentWeather.time).getTime();
      const hourlyTimes = data.hourly?.time ?? [];
      const probabilities =
        data.hourly?.precipitation_probability ?? [];

      let closestIndex = -1;
      let smallestDifference = Infinity;

      hourlyTimes.forEach((time, index) => {
        const difference = Math.abs(
          new Date(time).getTime() - currentTime
        );

        if (difference < smallestDifference) {
          smallestDifference = difference;
          closestIndex = index;
        }
      });

      const probability =
        closestIndex >= 0 ? probabilities[closestIndex] : null;

      setRainProbability(
        Number.isFinite(probability) ? probability : null
      );

      setLastFetched(new Date());
    } catch (err) {
      setError(err.message || "Unable to load weather.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeather();

    const interval = setInterval(
      loadWeather,
      5 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [loadWeather]);

  const precipitation = Number(weather?.precipitation ?? 0);
  const rain = Number(weather?.rain ?? 0);
  const showers = Number(weather?.showers ?? 0);

  const isWet =
    precipitation > 0 || rain > 0 || showers > 0;

  const highRainChance =
    rainProbability !== null && rainProbability >= 60;

  const rainStatus = getRainStatus(weather, rainProbability);

  if (loading && !weather) {
    return (
      <section className="weather-card">
        <p className="weather-eyebrow">LIVE WEATHER</p>
        <h2>Khulna Weather</h2>
        <p className="weather-loading">
          Loading weather data...
        </p>
      </section>
    );
  }

  return (
    <section className="weather-card">
      <div className="weather-header">
        <div className="weather-heading">
          <p className="weather-eyebrow">LIVE WEATHER</p>
          <h2>Khulna Weather</h2>
          <p className="weather-source">
            Khulna, Bangladesh · Open-Meteo
          </p>
        </div>

        <button
          type="button"
          className="weather-refresh"
          onClick={loadWeather}
          aria-label="Refresh weather"
          title="Refresh weather"
        >
          ↻
        </button>
      </div>

      {error && (
        <p className="weather-error" role="alert">
          {weather
            ? `Refresh failed: ${error} Showing the last available data.`
            : error}
        </p>
      )}

      {weather && (
        <>
          <div className="weather-main">
            <div className="weather-temperature-block">
              <span className="weather-temperature">
                {formatNumber(weather.temperature_2m)}°C
              </span>

              <p className="weather-feels-like">
                Feels like{" "}
                {formatNumber(weather.apparent_temperature)}°C
              </p>
            </div>

            <div className="weather-condition">
              <span
                className="weather-condition-icon"
                aria-hidden="true"
              >
                {isWet
                  ? "🌧️"
                  : highRainChance
                  ? "🌦️"
                  : "🌤️"}
              </span>

              <strong>{rainStatus}</strong>
            </div>
          </div>

          <div className="weather-metrics">
            <div className="weather-metric">
              <span>Humidity</span>
              <strong>
                {formatNumber(weather.relative_humidity_2m, 0)}%
              </strong>
            </div>

            <div className="weather-metric">
              <span>Rainfall</span>
              <strong>{formatNumber(rain)} mm</strong>
            </div>

            <div className="weather-metric">
              <span>Precipitation</span>
              <strong>{formatNumber(precipitation)} mm</strong>
            </div>

            <div className="weather-metric">
              <span>Rain chance</span>
              <strong>
                {rainProbability === null
                  ? "--"
                  : `${rainProbability}%`}
              </strong>
            </div>

            <div className="weather-metric">
              <span>Wind speed</span>
              <strong>
                {formatNumber(weather.wind_speed_10m)} km/h
              </strong>
            </div>

            <div className="weather-metric">
              <span>Weather code</span>
              <strong>
                {Number.isFinite(Number(weather.weather_code))
                  ? weather.weather_code
                  : "--"}
              </strong>
            </div>
          </div>

          {(isWet || highRainChance) && (
            <div className="rain-alert" role="status">
              <strong>
                ⚠ {isWet ? "Wet-road caution" : "Rain forecast alert"}
              </strong>

              <p>
                {isWet
                  ? "Precipitation is reported in the weather data. Roads may be slippery. Reduce speed and maintain a safe distance."
                  : "The forecast indicates a high chance of rain. Be prepared for wet roads and drive carefully."}
              </p>
            </div>
          )}

          <div className="weather-footer">
            <p className="weather-timestamp">
              Weather data time: {weather.time}
            </p>

            {lastFetched && (
              <p className="weather-updated">
                Last checked: {lastFetched.toLocaleTimeString()}
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}