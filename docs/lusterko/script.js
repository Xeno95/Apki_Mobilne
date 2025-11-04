(() =>
{
    const btnScan = document.getElementById("btn-scan");
    const btnStop = document.getElementById("btn-stop");
    const support = document.getElementById("support");
    const statusEl = document.getElementById("status");
    const serialEl = document.getElementById("serial");
    const outEl = document.getElementById("output");

    // wsparcie i kontekst bezpieczeństwa
    const supported = "NDEFReader" in window;
    const secure = window.isSecureContext || location.hostname === "localhost";
    support.textContent = supported
        ? (secure ? "✅ Web NFC dostępne." : "⚠️ Wymagany HTTPS — na http nie działa.")
        : "❌ Brak wsparcia Web NFC w tej przeglądarce.";

    let reader = null;
    let abortController = null;

    btnScan.addEventListener("click", async() =>
    {
        if(!supported || !secure) return;
        try
        {
            abortController = new AbortController();
            reader = new NDEFReader();
            await reader.scan({signal: abortController.signal}); // prośba o pozwolenie

            statusEl.textContent = "Skanowanie włączone. Zbliż kartę…";
            btnScan.disabled = true;
            btnStop.disabled = true;

            reader.onreadingerror = (e) =>
            {
                statusEl.innerHTML = `<span class="err">Błąd odczytu: ${e.message || "nieznany"}</span>`;
            };

            reader.onreading = (event) =>
            {
                btnStop.disabled = false;
                const {message, serialNumber} = event;
                serialEl.textContent = serialNumber ? `UID/Serial: ${serialNumber}` : "";
                statusEl.textContent = "Tag wykryty. Rekordy NDEF:";

                const parsed = [];
                for(const record of message.records)
                {
                    parsed.push(formatRecord(record));
                }
                outEl.textContent = JSON.stringify(parsed, null, 2);
            };
        }
        catch(err)
        {
            statusEl.innerHTML = `<span class="err">Nie można rozpocząć skanowania: ${err.message || err}</span>`;
        }
    });

    btnStop.addEventListener("click", () =>
    {
        try
        {
            abortController?.abort();
            statusEl.textContent = "Skanowanie zatrzymane.";
        }
        catch
        {
        }
        btnScan.disabled = false;
        btnStop.disabled = true;
    });

    // ———————————————————— pomocnicze: dekodowanie rekordów ————————————————————
    function formatRecord(record)
    {
        const {recordType, mediaType} = record;

        if(recordType === "text")
        {
            const text = decodeTextRecord(record);
            return {type: "text", text};
        }

        if(recordType === "url" || recordType === "absolute-url")
        {
            const url = decodeUrlRecord(record);
            return {type: "url", url};
        }

        if(recordType === "mime" && mediaType)
        {
            const buf = bufferFromRecord(record);
            return {type: "mime", mediaType, bytesPreview: hexPreview(buf)};
        }

        const buf = bufferFromRecord(record);
        return {type: recordType || "unknown", bytesPreview: hexPreview(buf)};
    }

    function decodeTextRecord(rec)
    {
        const data = bufferFromRecord(rec);
        if(!data || data.length === 0) return "";
        const status = data[0];
        const langLen = status & 0x3f;
        const utf16 = (status & 0x80) !== 0;
        const textBytes = data.slice(1 + langLen);
        const decoder = new TextDecoder(utf16 ? "utf-16" : "utf-8");
        return decoder.decode(textBytes);
    }

    function decodeUrlRecord(rec)
    {
        try
        {
            if(typeof rec.data === "string") return rec.data;
        }
        catch
        {}
        const data = bufferFromRecord(rec);
        try
        {
            return new TextDecoder("utf-8").decode(data);
        }
        catch
        {
            return "(nie udało się zdekodować URL)";
        }
    }

    function bufferFromRecord(rec)
    {
        try
        {
            if(rec.data instanceof DataView)
            {
                return new Uint8Array(rec.data.buffer, rec.data.byteOffset, rec.data.byteLength);
            }
        }
        catch
        {}
        return new Uint8Array(0);
    }

    function hexPreview(u8, max = 64)
    {
        const n = Math.min(u8.length, max);
        let s = "";
        for(let i = 0; i < n; i++) s += u8[i].toString(16).padStart(2, "0") + (i + 1 < n ? " " : "");
        if(u8.length > max) s += ` … (+${u8.length - max}B)`;
        return s || "(pusty)";
    }
})();
