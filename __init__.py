"""Milooo Heating Visualiser integration."""

import logging
from pathlib import Path

from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry, ConfigSubentry
from homeassistant.core import HomeAssistant

from .const import DOMAIN, DEVICES
from .frontend_loader import async_register_lovelace_resource
from .websocket_api import async_register_websocket_api

_LOGGER = logging.getLogger(__name__)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up the Milooo Heating Visualiser integration (global)."""
    frontend_dir = Path(__file__).parent / "frontend"

    await hass.http.async_register_static_paths([
        StaticPathConfig(
            url_path=f"/{DOMAIN}/frontend",
            path=str(frontend_dir),
            cache_headers=False,
        )
    ])
    _LOGGER.info("Milooo Heating Visualiser: frontend registered at %s", frontend_dir)

    hass.async_create_task(async_register_lovelace_resource(hass))
    async_register_websocket_api(hass)

    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Milooo Heating Visualiser from a config entry."""
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = dict(entry.data)

    # Auto-tworzenie subentries dla urządzeń always_present
    existing_device_ids = {
        sub.data.get("device_id")
        for sub in entry.subentries.values()
    }

    _LOGGER.info(
        "Milooo Heating Visualiser: existing subentries = %s",
        list(existing_device_ids),
    )

    for device_id, meta in DEVICES.items():
        if not meta.get("always_present"):
            continue
        if device_id in existing_device_ids:
            continue

        try:
            subentry = ConfigSubentry(
                data={"device_id": device_id},
                subentry_type="device",
                title=meta.get("default_label", device_id),
                unique_id=device_id,
            )
            # async_add_subentry jest SYNCHRONICZNA (ma @callback, nie async)
            result = hass.config_entries.async_add_subentry(entry, subentry)
            _LOGGER.info(
                "Milooo HeatingVisualiser: auto-added subentry %s (result=%s)",
                device_id,
                result,
            )
        except Exception as err:  # noqa: BLE001
            _LOGGER.error(
                "Milooo Heating Visualiser: failed to auto-add subentry %s: %s",
                device_id,
                err,
            )

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload an Milooo Heating Visualiser config entry."""
    hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
    return True