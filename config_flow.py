"""Config flow for Milooo Heating Visualiser."""

import logging
import voluptuous as vol

from homeassistant import config_entries
from homeassistant.data_entry_flow import section
from homeassistant.helpers import selector

from .const import DOMAIN, NAME, SVG_FIELDS, DEVICES

_LOGGER = logging.getLogger(__name__)

# ============================================================
# DEFINICJE SEKCJI — per urządzenie
# ============================================================
DEVICE_SECTIONS = {
    "heat_pump_outdoor": [
        {"id": "outdoor_sensors", "fields": [
            "hp_ambient_temp", "hp_defrost", "hp_high_pressure", "hp_low_pressure",
            "hp_eva_exit_temp", "hp_ipm_temp", "hp_pipe_temp",
            "hp_comp_discharge_temp", "hp_comp_tank_temp",
            "hp_fan1_speed", "hp_fan2_speed", "hp_comp_freq", "hp_comp_current", "hp_cop", "hp_bypass_exit_temp"
        ]},
        {"id": "outdoor_valves", "fields": [
            "hp_2way_valve", "hp_4way_valve", "hp_expansion_valve", "hp_pressure_switch"
        ]},
        {"id": "visibility", "fields": ["outdoor_labels_visible", "outdoor_signs_visible", "label_source"]},
        
        {"id": "animations", "fields": ["outdoor_fan_animation_enabled","hp_2way_valve_state", "hp_pump_duty", "hp_defrosting_state" ]},
    ],
    "heat_pump_indoor": [
        {"id": "indoor_sensors", "fields": [
            "hp_water_flow", "hp_inlet_water_temp", "hp_outlet_water_temp",
            "hp_hex_outlet_temp", "hp_indoor_ref_temp", "hp_3way_valve"
        ]},
        {"id": "visibility", "fields": ["indoor_labels_visible", "indoor_signs_visible", "zone_labels_visible", "zone_signs_visible", "label_source"]},
        {"id": "animations", "fields": ["hp_pump_speed"]},
    ],
    "dhw": [
        {"id": "data", "fields": ["dhw_temp", "dhw_target_temp"]},
        {"id": "visibility", "fields": ["dhw_labels_visible", "dhw_signs_visible"]},
    ],
    "zone_1": [
        {"id": "data", "fields": ["zone1_temp", "zone1_target_temp"]},
    ],
    "zone_2": [
        {"id": "data", "fields": ["zone2_temp", "zone2_target_temp"]},
    ],
    "weather": [
        {"id": "data", "fields": [
            "weather_rain", "weather_pressure", "weather_wind_direction",
            "weather_wind_speed", "weather_humidity", "weather_sunrise", "weather_sunset",
            "weather_condition", #"weather_precipitation_rate",
        ]},
        {"id": "visibility", "fields": [
            "weather_labels_visible", "weather_signs_visible",
            "weather_animation_enabled", "weather_precipitation_enabled",
            "weather_daynight_background_enabled",
        ]},
    ],
}

def _build_field(field_id: str, current: dict):
    meta = SVG_FIELDS.get(field_id, {})
    input_type = meta.get("input_type", "entity")
    suggested = current.get(field_id)

    if input_type == "boolean":
        default = current.get(field_id, meta.get("default", True))
        return selector.BooleanSelector(), {"default": default}

    if input_type == "choice":
        options = meta.get("options", [])
        default = current.get(field_id, meta.get("default", options[0] if options else ""))
        return (
            selector.SelectSelector(
                selector.SelectSelectorConfig(
                    options=options,
                    mode=selector.SelectSelectorMode.DROPDOWN,
                )
            ),
            {"default": default},
        )

    # ENTITY (domyślnie)
    kwargs = {}
    if suggested:
        kwargs["description"] = {"suggested_value": suggested}
    
    # Bazowa konfiguracja selektora
    entity_config = {
        "domain": ["sensor", "binary_sensor", "input_number", "number", "input_boolean", "switch", "weather"]
    }
    
    # Bezpieczne filtrowanie po device_class:
    # Stosujemy TYLKO jeśli device_class jest zdefiniowany i nie jest to None.
    device_class = meta.get("device_class")
    
    if device_class is not None:
        # Opcjonalnie: nie filtrujemy po device_class dla domeny weather (bo encje pogodowe nie mają device_class)
        # Ale w tym przypadku device_class jest zdefiniowany, więc raczej nie dotyczy to weather.
        entity_config["device_class"] = [device_class]

    return (
        selector.EntitySelector(
            selector.EntitySelectorConfig(**entity_config)
        ),
        kwargs,
    )

def _build_schema_for_device(device_id: str, current: dict) -> dict:
    schema = {}
    device_sections = DEVICE_SECTIONS.get(device_id, [])

    for sec in device_sections:
        section_id = sec["id"]
        section_fields = {}

        for field_id in sec["fields"]:
            meta = SVG_FIELDS.get(field_id)
            if not meta:
                continue
            input_type = meta.get("input_type", "entity")
            if input_type == "label":
                continue

            field_selector, kwargs = _build_field(field_id, current)
            section_fields[vol.Optional(field_id, **kwargs)] = field_selector

        if not section_fields:
            continue

        schema[vol.Optional(section_id)] = section(
            vol.Schema(section_fields),
            {"collapsed": True},
        )

    return schema

def _clean_input(user_input: dict) -> dict:
    cleaned = {}
    def _process_field(key: str, value):
        meta = SVG_FIELDS.get(key, {})
        input_type = meta.get("input_type", "entity")
        if input_type == "boolean":
            cleaned[key] = bool(value)
        else:
            cleaned[key] = value if value not in (None, "") else None

    for key, value in user_input.items():
        if isinstance(value, dict):
            for sub_key, sub_value in value.items():
                _process_field(sub_key, sub_value)
        else:
            _process_field(key, value)
    return cleaned

class MiloooHeatingConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input=None):
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")
        if user_input is not None:
            return self.async_create_entry(title=NAME, data=user_input)
        return self.async_show_form(step_id="user", data_schema=vol.Schema({}))

    @staticmethod
    def async_get_options_flow(config_entry):
        return MiloooHeatingOptionsFlow()

    @classmethod
    def async_get_supported_subentry_types(cls, config_entry):
        return {"device": MiloooHeatingSubentryFlow}

class MiloooHeatingOptionsFlow(config_entries.OptionsFlow):
    async def async_step_init(self, user_input=None):
        return self.async_create_entry(title="", data={})

class MiloooHeatingSubentryFlow(config_entries.ConfigSubentryFlow):
    async def async_step_user(self, user_input=None):
        if user_input is not None:
            device_id = user_input["device_id"]
            self._selected_device_id = device_id
            return await self.async_step_configure()

        from .websocket_api import _load_translations
        _, device_labels = await _load_translations(self.hass)

        entry = self._get_entry()
        existing = [sub.data.get("device_id") for sub in entry.subentries.values()]

        options = []
        for dev_id in DEVICES.keys():
            if dev_id in existing:
                continue
            label_key = DEVICES[dev_id].get("label_key", dev_id)
            default_label = DEVICES[dev_id].get("default_label", dev_id)
            label = device_labels.get(label_key) or default_label
            options.append({"value": dev_id, "label": label})

        if not options:
            return self.async_abort(reason="all_devices_configured")

        schema = vol.Schema({
            vol.Required("device_id"): selector.SelectSelector(
                selector.SelectSelectorConfig(options=options, mode=selector.SelectSelectorMode.LIST)
            ),
        })
        return self.async_show_form(step_id="user", data_schema=schema)

    async def async_step_configure(self, user_input=None):
        device_id = self._selected_device_id
        device_meta = DEVICES.get(device_id, {})
        device_title = device_meta.get("default_label", device_id)

        if user_input is not None:
            cleaned = _clean_input(user_input)
            cleaned["device_id"] = device_id
            return self.async_create_entry(title=device_title, data=cleaned)

        current = {}
        schema_dict = _build_schema_for_device(device_id, current)
        schema = vol.Schema(schema_dict)
        return self.async_show_form(step_id="configure", data_schema=schema)

    async def async_step_reconfigure(self, user_input=None):
        entry = self._get_entry()
        subentry = self._get_reconfigure_subentry()
        device_id = subentry.data.get("device_id")

        if device_id is None:
            return self.async_abort(reason="device_id_missing")

        self._selected_device_id = device_id
        device_meta = DEVICES.get(device_id, {})
        device_title = device_meta.get("default_label", device_id)

        if user_input is not None:
            cleaned = _clean_input(user_input)
            cleaned["device_id"] = device_id
            return self.async_update_reload_and_abort(entry, subentry, title=device_title, data=cleaned)

        current = dict(subentry.data or {})
        schema_dict = _build_schema_for_device(device_id, current)
        schema = vol.Schema(schema_dict)
        return self.async_show_form(step_id="reconfigure", data_schema=schema)