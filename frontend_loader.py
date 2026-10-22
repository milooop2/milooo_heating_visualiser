"""Automatic Lovelace resource registration for Milooo Heating Visualiser."""

import logging
from homeassistant.components.lovelace import DOMAIN as LOVELACE_DOMAIN
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED
from homeassistant.core import HomeAssistant, callback

_LOGGER = logging.getLogger(__name__)

# Rejestrujemy obie karty jako osobne zasoby (moduły ES).
RESOURCE_URLS = [
    "/milooo_heating_visualiser/frontend/milooo-heating-general.js",
    "/milooo_heating_visualiser/frontend/milooo-heating-details.js",
]
RESOURCE_TYPE = "module"


async def async_register_lovelace_resource(hass: HomeAssistant) -> None:
    if not hass.is_running:
        @callback
        def _started(_event):
            hass.async_create_task(_do_register(hass))
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, _started)
    else:
        await _do_register(hass)


async def _do_register(hass: HomeAssistant) -> None:
    lovelace_data = hass.data.get(LOVELACE_DOMAIN)
    if lovelace_data is None:
        _LOGGER.warning("Lovelace data not available; add resources manually.")
        return

    resources = getattr(lovelace_data, "resources", None)
    if resources is None:
        _LOGGER.warning("lovelace_data.resources not available; add manually.")
        return

    if not hasattr(resources, "async_create_item"):
        _LOGGER.info("Lovelace is in YAML mode; add resources manually.")
        return

    try:
        existing = resources.async_items()
    except Exception as err:
        _LOGGER.error("Could not list Lovelace resources: %s", err)
        return

    existing_urls = {item.get("url") for item in existing}

    for url in RESOURCE_URLS:
        if url in existing_urls:
            _LOGGER.info("Lovelace resource already registered: %s", url)
            continue
        try:
            await resources.async_create_item({"url": url, "res_type": RESOURCE_TYPE})
            _LOGGER.info("Registered Lovelace resource %s", url)
        except Exception as err:
            _LOGGER.error("Failed to register Lovelace resource %s: %s", url, err)