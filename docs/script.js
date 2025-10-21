document.addEventListener("DOMContentLoaded", () =>
{
    // ===== GEO =====
    const out = document.getElementById("geo");
    if(!("geolocation" in navigator))
    {
        out.textContent = "Błąd: przeglądarka nie obsługuje geolokalizacji.";
    }
    else
    {
        navigator.geolocation.getCurrentPosition(
            (p) =>
            {
                const {latitude, longitude, accuracy} = p.coords;
                out.textContent =
                    `Szerokość: ${latitude.toFixed(6)}°, ` +
                    `Dł.: ${longitude.toFixed(6)}° (±${Math.round(accuracy)} m)`;
            },
            (e) =>
            {
                out.textContent = `Błąd: ${e.message}`;
            },
            {enableHighAccuracy: true, timeout: 10000, maximumAge: 0}
        );
    }

    // ===== GYRO (najprościej) =====
    const statusEl = document.getElementById("gyro-status");
    const alphaEl = document.getElementById("alpha");
    const betaEl = document.getElementById("beta");
    const gammaEl = document.getElementById("gamma");

    if(typeof DeviceOrientationEvent === "undefined")
    {
        statusEl.textContent = "Brak wsparcia DeviceOrientation.";
        return;
    }

    // Android Chrome zwykle nie wymaga dodatkowych pozwoleń.
    window.addEventListener("deviceorientation", (ev) =>
    {
        if(ev.alpha == null && ev.beta == null && ev.gamma == null)
        {
            statusEl.textContent = "Brak danych z czujników.";
            return;
        }
        statusEl.textContent = "Działa.";
        // α: 0–360, β: -180–180, γ: -90–90
        alphaEl.textContent = Number(ev.alpha).toFixed(1);
        betaEl.textContent = Number(ev.beta).toFixed(1);
        gammaEl.textContent = Number(ev.gamma).toFixed(1);
    }, {passive: true});
});
