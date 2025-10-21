import {useEffect} from "react";
import "./App.css";

function App()
{
    useEffect(() =>
    {
        navigator.geolocation?.getCurrentPosition(
            p => (document.getElementById("geo").textContent =
                `Szerokość: ${p.coords.latitude.toFixed(6)}°, Dł.: ${p.coords.longitude.toFixed(6)}° (±${Math.round(p.coords.accuracy)} m)`),
            e => (document.getElementById("geo").textContent = `Błąd: ${e.message}`)
        );
    }, []);

    return (
        <div className={"root"}>
            <header className={"a"}>
                a
            </header>

            <section className={"b"}>b</section>
            <section className={"c"}>c</section>
            <aside className={"d"}>d</aside>

            <article className={"e"} id={"geo"}>
                Pobieram lokalizację…
            </article>

            <footer className={"f"}>f</footer>
        </div>
    );
}

export default App;
