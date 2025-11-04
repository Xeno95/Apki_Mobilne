(() => {
    const overlay  = document.getElementById("overlay");
    const statusEl = document.getElementById("status");
    const serialEl = document.getElementById("serial");
    const outEl    = document.getElementById("out");

    const supported = "NDEFReader" in window;
    const secure = window.isSecureContext || location.hostname === "localhost";

    if (!supported) {
        statusEl.innerHTML = '<span class="err">Brak wsparcia Web NFC w tej przeglądarce.</span>';
        overlay.classList.add("hidden"); // nie ma sensu czekać na tap
        return;
    }
    if (!secure) {
        statusEl.innerHTML = '<span class="err">Wymagany HTTPS (albo localhost).</span>';
        overlay.classList.add("hidden");
        return;
    }

    let abortCtrl = null;
    let reader = null;

    async function startScan() {
        try {
            abortCtrl = new AbortController();
            reader = new NDEFReader();
            await reader.scan({ signal: abortCtrl.signal }); // musi być po geście użytkownika
            statusEl.innerHTML = '<span class="ok">Skanowanie aktywne. Przyłóż kartę…</span>';

            reader.onreadingerror = (e) => {
                statusEl.innerHTML = `<span class="err">Błąd odczytu: ${e.message || "spróbuj ponownie"}</span>`;
            };

            reader.onreading = (event) => {
                const { message, serialNumber } = event;
                serialEl.textContent = serialNumber ? `UID/Serial: ${serialNumber}` : "";
                statusEl.innerHTML = '<span class="ok">Tag wykryty. Odczytano rekordy NDEF:</span>';

                const parsed = [];
                for (const record of message.records) parsed.push(formatRecord(record));
                outEl.textContent = JSON.stringify(parsed, null, 2);
            };
        } catch (err) {
            statusEl.innerHTML = `<span class="err">Nie można włączyć skanowania: ${err.message || err}</span>`;
        }
    }

    // Minimalny „gest użytkownika”: dotknięcie dowolnego miejsca na nakładce
    overlay.addEventListener("click", async () => {
        overlay.classList.add("hidden");
        await startScan();
    }, { once: true });

    // Kontynuuj nasłuch po powrocie do karty (oszczędzanie baterii)
    document.addEventListener("visibilitychange", async () => {
        if (document.hidden) {
            abortCtrl?.abort();
            statusEl.textContent = "Wstrzymane (karta w tle).";
        } else if (overlay.classList.contains("hidden")) {
            // po pierwszym geście możemy wznawiać automatycznie (bez kolejnych kliknięć)
            await startScan();
        }
    });

    // ——— pomocnicze dekodowanie rekordów NDEF ———
    function formatRecord(record) {
        const { recordType, mediaType } = record;

        if (recordType === "text") {
            const text = decodeTextRecord(record);
            return { type: "text", text };
        }
        if (recordType === "url" || recordType === "absolute-url") {
            const url = decodeUrlRecord(record);
            return { type: "url", url };
        }
        if (recordType === "mime" && mediaType) {
            const buf = bufferFromRecord(record);
            return { type: "mime", mediaType, bytesPreview: hexPreview(buf) };
        }
        const buf = bufferFromRecord(record);
        return { type: recordType || "unknown", bytesPreview: hexPreview(buf) };
    }

    function decodeTextRecord(rec) {
        const data = bufferFromRecord(rec);
        if (!data.length) return "";
        const status = data[0];
        const langLen = status & 0x3f;
        const utf16 = (status & 0x80) !== 0;
        const textBytes = data.slice(1 + langLen);
        const dec = new TextDecoder(utf16 ? "utf-16" : "utf-8");
        return dec.decode(textBytes);
    }

    function decodeUrlRecord(rec) {
        try { if (typeof rec.data === "string") return rec.data; } catch {}
        return new TextDecoder("utf-8").decode(bufferFromRecord(rec));
    }
    function bufferFromRecord(rec) {
        try {
            if (rec.data instanceof DataView)
                return new Uint8Array(rec.data.buffer, rec.data.byteOffset, rec.data.byteLength);
        } catch {}
        return new Uint8Array(0);
    }
    function hexPreview(u8, max = 64) {
        const n = Math.min(u8.length, max);
        let s = "";
        for (let i = 0; i < n; i++) s += u8[i].toString(16).padStart(2, "0") + (i + 1 < n ? " " : "");
        if (u8.length > max) s += ` … (+${u8.length - max}B)`;
        return s || "(pusty)";
    }
})();
