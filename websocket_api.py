"""WebSocket API for Milooo Heating Visualiser."""

import json
import logging
from pathlib import Path

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from .const import DOMAIN, SVG_FIELDS, DEVICES

_LOGGER = logging.getLogger(__name__)


def _read_json_file(path: Path) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


async def _load_translations(hass: HomeAssistant) -> tuple[dict, dict]:
    lang = hass.config.language or "en"
    translations_dir = Path(__file__).parent / "translations"

    candidates = [
        translations_dir / f"{lang}.json",
        translations_dir / f"{lang.split('-')[0]}.json",
        translations_dir / "en.json",
    ]

    file_path = None
    for candidate in candidates:
        if candidate.exists():
            file_path = candidate
            break

    if file_path is None:
        return {}, {}

    try:
        data = await hass.async_add_executor_job(_read_json_file, file_path)

        field_labels = dict(
            data.get("options", {})
            .get("step", {})
            .get("init", {})
            .get("data", {})
        )

        label_section = data.get("label", {})
        for k, v in label_section.items():
            if k not in field_labels:
                field_labels[k] = v

        device_labels = data.get("device", {})
        return field_labels, device_labels
    except Exception as err:
        _LOGGER.error("Milooo Heating Visualiser: failed to load translations: %s", err)
        return {}, {}


@callback
def async_register_websocket_api(hass: HomeAssistant) -> None:
    websocket_api.async_register_command(hass, ws_get_config)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "milooo_heating_visualiser/get_config",
    }
)
@websocket_api.async_response
async def ws_get_config(hass: HomeAssistant, connection, msg) -> None:
    entries = hass.config_entries.async_entries(DOMAIN)
    if not entries:
        connection.send_error(
            msg["id"], "not_found", "Milooo Heating Visualiser not configured"
        )
        return

    entry = entries[0]
    mapping = dict(entry.options or {})
    devices_present = set()

    try:
        subentries = entry.subentries
    except AttributeError:
        subentries = {}

    for subentry in subentries.values():
        sub_type = getattr(subentry, "subentry_type", None)
        if sub_type != "device":
            continue
        device_id = subentry.data.get("device_id")
        if device_id:
            devices_present.add(device_id)
        for k, v in subentry.data.items():
            if k == "device_id":
                continue
            mapping[k] = v

    field_labels, device_labels = await _load_translations(hass)

    enriched_fields = {}
    for field_id, meta in SVG_FIELDS.items():
        enriched = dict(meta)
        label_key = meta.get("label_key", field_id)
        enriched["label"] = (
            field_labels.get(label_key)
            or field_labels.get(field_id)
            or label_key
        )
        enriched_fields[field_id] = enriched

    enriched_devices = {}
    for device_id, device_meta in DEVICES.items():
        enriched = dict(device_meta)
        label_key = device_meta.get("label_key", device_id)
        enriched["label"] = device_labels.get(label_key, label_key)
        enriched_devices[device_id] = enriched

    connection.send_result(
        msg["id"],
        {
            "fields": enriched_fields,
            "devices": enriched_devices,
            "devices_present": list(devices_present),
            "mapping": mapping,
        },
    )