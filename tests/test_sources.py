from __future__ import annotations

import socket

import httpx

from services.api.app.adapters.sources import fetch_registered_source, fetch_weather


def public_dns(monkeypatch):
    monkeypatch.setattr(
        socket,
        "getaddrinfo",
        lambda host, port, type=0: [(socket.AF_INET, socket.SOCK_STREAM, 0, "", ("93.184.216.34", 443))],
    )


def test_fetch_registered_source_returns_compact_snapshot(monkeypatch):
    public_dns(monkeypatch)

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.host == "example.com"
        return httpx.Response(
            200,
            headers={"content-type": "text/html; charset=utf-8"},
            text="<html><head><title>Official Notice</title></head><body><h1>Notice</h1><script>secret()</script><p>Schedule changed on Oct 7.</p></body></html>",
        )

    result = fetch_registered_source(
        "https://example.com/notices?id=1#frag",
        ["example.com"],
        transport=httpx.MockTransport(handler),
    )

    assert result["status"] == "ok"
    assert result["url"] == "https://example.com/notices?id=1"
    assert result["title"] == "Official Notice"
    assert result["summary"] == "Official Notice Notice Schedule changed on Oct 7."
    assert "secret" not in result["content"]
    assert len(result["body_hash"]) == 64


def test_fetch_registered_source_rechecks_redirect_allowlist(monkeypatch):
    public_dns(monkeypatch)

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.host == "example.com":
            return httpx.Response(302, headers={"location": "https://evil.example.net/final"})
        return httpx.Response(200, text="bad")

    result = fetch_registered_source(
        "https://example.com/start",
        ["example.com"],
        transport=httpx.MockTransport(handler),
    )

    assert result["status"] == "error"
    assert "allowlist" in result["error"]


def test_fetch_registered_source_blocks_private_network_resolution(monkeypatch):
    monkeypatch.setattr(
        socket,
        "getaddrinfo",
        lambda host, port, type=0: [(socket.AF_INET, socket.SOCK_STREAM, 0, "", ("127.0.0.1", 80))],
    )

    result = fetch_registered_source(
        "https://example.com/notice",
        ["example.com"],
        transport=httpx.MockTransport(lambda request: httpx.Response(200, text="never called")),
    )

    assert result["status"] == "error"
    assert "non-public" in result["error"]


def test_fetch_registered_source_supports_subdomain_allowlist(monkeypatch):
    public_dns(monkeypatch)

    result = fetch_registered_source(
        "https://status.example.com/feed",
        ["*.example.com"],
        transport=httpx.MockTransport(lambda request: httpx.Response(200, text="All clear")),
    )

    assert result["status"] == "ok"
    assert result["summary"] == "All clear"


def test_fetch_weather_returns_units_and_daily_rows():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.host == "api.open-meteo.com"
        assert request.url.params["forecast_days"] == "2"
        return httpx.Response(
            200,
            json={
                "daily_units": {
                    "time": "iso8601",
                    "temperature_2m_max": "degC",
                    "precipitation_sum": "mm",
                },
                "daily": {
                    "time": ["2026-10-01", "2026-10-02"],
                    "temperature_2m_max": [19.5, 20.0],
                    "precipitation_sum": [0.0, 3.2],
                },
            },
        )

    result = fetch_weather(
        {"id": "SITE-H1", "latitude": 37.56, "longitude": 126.97, "timezone": "Asia/Seoul"},
        days=2,
        transport=httpx.MockTransport(handler),
    )

    assert result["status"] == "ok"
    assert result["source_id"] == "SITE-H1"
    assert result["forecast"]["validity"] == {"start": "2026-10-01", "end": "2026-10-02", "days": 2}
    assert result["forecast"]["units"]["precipitation_sum"] == "mm"
    assert result["forecast"]["data"][1]["temperature_2m_max"] == 20.0


def test_fetch_weather_reports_missing_coordinates():
    result = fetch_weather({"id": "SITE-H1"}, transport=httpx.MockTransport(lambda request: httpx.Response(200)))

    assert result["status"] == "error"
    assert "latitude" in result["error"]
