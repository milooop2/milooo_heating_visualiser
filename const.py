"""Constants for Milooo Heating Visualiser."""

DOMAIN = "milooo_heating_visualiser"
NAME = "Milooo Heating Visualiser"
VERSION = "0.1.0"

# ============================================================
# DEFINICJE URZĄDZEŃ
# ============================================================
DEVICES = {
    "heat_pump_outdoor": {"label_key": "device_heat_pump_outdoor", "default_label": "Pompa ciepła (Outdoor)", "icon": "mdi:heat-pump-outline", "always_present": True},
    "heat_pump_indoor":  {"label_key": "device_heat_pump_indoor",  "default_label": "Pompa ciepła (Indoor)",  "icon": "mdi:heat-pump",         "always_present": True},
    "dhw":               {"label_key": "device_dhw",               "default_label": "CWU",                    "icon": "mdi:water-boiler",      "always_present": False},
    "zone_1":            {"label_key": "device_zone_1",            "default_label": "Strefa 1",               "icon": "mdi:home-thermometer",  "always_present": False},
    "zone_2":            {"label_key": "device_zone_2",            "default_label": "Strefa 2",               "icon": "mdi:home-thermometer",  "always_present": False},
    "weather":           {"label_key": "device_weather",           "default_label": "Pogoda",                 "icon": "mdi:weather-partly-cloudy", "always_present": False},
}

# ============================================================
# DEFINICJE PÓL (SVG)
# ============================================================
SVG_FIELDS = {
    # ============================================================
    # GLOBALNE
    # ============================================================
    "label_source": {
        "input_type": "choice",
        "device": "global",
        "label_key": "label_source",
        "options": ["HA", "svg"],
        "default": "HA",
    },

    # ============================================================
    # POMPA CIEPŁA — OUTDOOR
    # ============================================================
    "outdoor_labels_visible": {"input_type": "boolean", "device": "heat_pump_outdoor", "label_key": "outdoor_labels_visible", "default": True},
    "outdoor_signs_visible":  {"input_type": "boolean", "device": "heat_pump_outdoor", "label_key": "outdoor_signs_visible",  "default": True},

    # --- Outdoor: Czujniki ---
    "hp_ambient_temp":        {"input_type": "entity", "device": "heat_pump_outdoor", "label_key": "hp_ambient_temp",        "group_id": "Ambient-temperature-temp-sensor", "label_id": "Ambient-temperature-temp-sensor-label", "data_id": "Ambient-temperature-temp-sensor-data", "sign_id": "Ambient-temperature-temp-sensor-sign", "hide_label_field": "outdoor_labels_visible", "hide_sign_field": "outdoor_signs_visible", "device_class": "temperature"},
    "hp_defrost":             {"input_type": "entity", "device": "heat_pump_outdoor", "label_key": "hp_defrost",             "group_id": "defrost-sensor", "label_id": "defrost-sensor-label", "data_id": "defrost-sensor-data", "sign_id": "Defrost-sensor-sign", "hide_label_field": "outdoor_labels_visible", "hide_sign_field": "outdoor_signs_visible", "device_class": "temperature"},
    "hp_high_pressure":       {"input_type": "entity", "device": "heat_pump_outdoor", "label_key": "hp_high_pressure",       "group_id": "high-pressure-sensor", "label_id": "high-pressure-sensor-label", "data_id": "high-pressure-sensor-data", "sign_id": "high-pressure-sensor-sign", "hide_label_field": "outdoor_labels_visible", "hide_sign_field": "outdoor_signs_visible", "device_class": "pressure"},
    "hp_low_pressure":        {"input_type": "entity", "device": "heat_pump_outdoor", "label_key": "hp_low_pressure",        "group_id": "low-pressure-sensor", "label_id": "low-pressure-sensor-label", "data_id": "low-pressure-sensor-data", "sign_id": "low-pressure-sensor-sign", "hide_label_field": "outdoor_labels_visible", "hide_sign_field": "outdoor_signs_visible", "device_class": "pressure"},
    "hp_eva_exit_temp":       {"input_type": "entity", "device": "heat_pump_outdoor", "label_key": "hp_eva_exit_temp",       "group_id": "eva-exit-temp-sensor", "label_id": "eva-exit-temp-sensor-label", "data_id": "eva-exit-temp-sensor-data", "sign_id": "eva-exit-temp-sensor-sign", "hide_label_field": "outdoor_labels_visible", "hide_sign_field": "outdoor_signs_visible", "device_class": "temperature"},
    "hp_ipm_temp":            {"input_type": "entity", "device": "heat_pump_outdoor", "label_key": "hp_ipm_temp",            "group_id": "IPM-Temp-sensor", "label_id": "IPM-Temp-sensor-label", "data_id": "IPM-Temp-sensor-data", "sign_id": "IPM-Temp-sensor-sign", "hide_label_field": "outdoor_labels_visible", "hide_sign_field": "outdoor_signs_visible", "device_class": "temperature"},
    "hp_pipe_temp":           {"input_type": "entity", "device": "heat_pump_outdoor", "label_key": "hp_pipe_temp",           "group_id": "pipe-temp-sensor", "label_id": "pipe-temp-sensor-label", "data_id": "pipe-temp-sensor-data", "sign_id": "pipe-temp-sensor-sign", "hide_label_field": "outdoor_labels_visible", "hide_sign_field": "outdoor_signs_visible", "device_class": "temperature"},
    "hp_comp_discharge_temp": {"input_type": "entity", "device": "heat_pump_outdoor", "label_key": "hp_comp_discharge_temp", "group_id": "compressor-discharge-temp-sensor", "label_id": "compressor-discharge-temp-sensor-label", "data_id": "compressor-discharge-temp-sensor-data", "sign_id": "compressor-discharge-temp-sensor-sign", "hide_label_field": "outdoor_labels_visible", "hide_sign_field": "outdoor_signs_visible", "device_class": "temperature"},
    "hp_comp_tank_temp":      {"input_type": "entity", "device": "heat_pump_outdoor", "label_key": "hp_comp_tank_temp",      "group_id": "compressor-tank-temp-sensor", "label_id": "compressor-tank-temp-sensor-label", "data_id": "compressor-tank-temp-sensor-data", "sign_id": "compressor-tank-temp-sensor-sign", "hide_label_field": "outdoor_labels_visible", "hide_sign_field": "outdoor_signs_visible", "device_class": "temperature"},
    "hp_fan1_speed":          {"input_type": "entity", "device": "heat_pump_outdoor", "label_key": "hp_fan1_speed",          "group_id": "fan-1-speed", "label_id": "fan-1-speed-label", "data_id": "fan-1-speed-data", "sign_id": None, "hide_label_field": "outdoor_labels_visible", "hide_sign_field": None, "device_class": None},
    "hp_fan2_speed":          {"input_type": "entity", "device": "heat_pump_outdoor", "label_key": "hp_fan2_speed",          "group_id": "fan-2-speed", "label_id": "fan-2-speed-label", "data_id": "fan-2-speed-data", "sign_id": None, "hide_label_field": "outdoor_labels_visible", "hide_sign_field": None, "device_class": None},
    "hp_comp_freq":           {"input_type": "entity", "device": "heat_pump_outdoor", "label_key": "hp_comp_freq",           "group_id": None, "label_id": None, "data_id": "compressor-freq-data", "sign_id": None, "hide_label_field": None, "hide_sign_field": None, "device_class": "frequency"},
    "hp_comp_current":        {"input_type": "entity", "device": "heat_pump_outdoor", "label_key": "hp_comp_current",        "group_id": None, "label_id": None, "data_id": "compressor-current-data", "sign_id": None, "hide_label_field": None, "hide_sign_field": None, "device_class": "current"},
    "hp_cop":                 {"input_type": "entity", "device": "heat_pump_outdoor", "label_key": "hp_cop",                 "group_id": "COP", "label_id": "COP-label", "data_id": "COP-data", "sign_id": None, "hide_label_field": "outdoor_labels_visible", "hide_sign_field": None, "device_class": None},
    "hp_bypass_exit_temp": {"input_type": "entity", "device": "heat_pump_outdoor", "label_key": "hp_bypass_exit_temp", "group_id": "bypass-exit-temp-sensor", "label_id": "bypass-exit-temp-sensor-label", "data_id": "bypass-exit-temp-sensor-data", "sign_id": "bypass-exit-temp-sensor-sign", "hide_label_field": "outdoor_labels_visible", "hide_sign_field": "outdoor_signs_visible", "device_class": "temperature"},

    # --- Outdoor: Zawory ---
    "hp_2way_valve":      {"input_type": "entity", "device": "heat_pump_outdoor", "label_key": "hp_2way_valve",      "group_id": "2-way-valve", "label_id": "2-way-valve-label", "data_id": "2-way-valve-data", "sign_id": None, "hide_label_field": "outdoor_labels_visible", "hide_sign_field": None, "device_class": None},
    "hp_4way_valve":      {"input_type": "entity", "device": "heat_pump_outdoor", "label_key": "hp_4way_valve",      "group_id": "4-way-valve", "label_id": "4-way-valve-label", "data_id": "4-way-valve-data", "sign_id": None, "hide_label_field": "outdoor_labels_visible", "hide_sign_field": None, "device_class": None},
    "hp_expansion_valve": {"input_type": "entity", "device": "heat_pump_outdoor", "label_key": "hp_expansion_valve", "group_id": "expansion-valve", "label_id": "expansion-valve-label", "data_id": "expansion-valve-data", "sign_id": None, "hide_label_field": "outdoor_labels_visible", "hide_sign_field": None, "device_class": None},
    "hp_pressure_switch": {"input_type": "entity", "device": "heat_pump_outdoor", "label_key": "hp_pressure_switch", "group_id": "pressure-switch", "label_id": "pressure-switch-label", "data_id": "pressure-switch-data", "sign_id": "pressure-switch-sign", "hide_label_field": "outdoor_labels_visible", "hide_sign_field": "outdoor_signs_visible", "device_class": None},
 
    # --- Outdoor: Animacje ---
    "outdoor_fan_animation_enabled": { "input_type": "boolean", "device": "heat_pump_outdoor", "label_key": "outdoor_fan_animation_enabled", "default": True,},
    "hp_pump_duty":       {"input_type": "entity", "device": "heat_pump_outdoor", "label_key": "hp_pump_duty",       "group_id": None, "label_id": None, "data_id": None, "sign_id": None, "device_class": None},
    "hp_defrosting_state": {"input_type": "entity", "device": "heat_pump_outdoor", "label_key": "hp_defrosting_state", "group_id": None, "label_id": None, "data_id": None, "sign_id": None, "device_class": None},

    # ============================================================
    # POMPA CIEPŁA — INDOOR
    # ============================================================
    "indoor_labels_visible": {"input_type": "boolean", "device": "heat_pump_indoor", "label_key": "indoor_labels_visible", "default": True},
    "indoor_signs_visible":  {"input_type": "boolean", "device": "heat_pump_indoor", "label_key": "indoor_signs_visible",  "default": True},
    "zone_labels_visible":   {"input_type": "boolean", "device": "heat_pump_indoor", "label_key": "zone_labels_visible",   "default": True},
    "zone_signs_visible":    {"input_type": "boolean", "device": "heat_pump_indoor", "label_key": "zone_signs_visible",    "default": True},

    "hp_water_flow":        {"input_type": "entity", "device": "heat_pump_indoor", "label_key": "hp_water_flow",        "group_id": "water-flow", "label_id": "water-flow-label", "data_id": "water-flow-data", "sign_id": "water-flow-sign", "hide_label_field": "indoor_labels_visible", "hide_sign_field": "indoor_signs_visible", "device_class": "volume_flow_rate"},
    "hp_inlet_water_temp":  {"input_type": "entity", "device": "heat_pump_indoor", "label_key": "hp_inlet_water_temp",  "group_id": "inlet-water-temp-sensor", "label_id": "inlet-water-temp-sensor-label", "data_id": "inlet-water-temp-sensor-data", "sign_id": "inlet-water-temp-sensor-sign", "hide_label_field": "indoor_labels_visible", "hide_sign_field": "indoor_signs_visible", "device_class": "temperature"},
    "hp_outlet_water_temp": {"input_type": "entity", "device": "heat_pump_indoor", "label_key": "hp_outlet_water_temp", "group_id": "outlet-water-temp-sensor", "label_id": "outlet-water-temp-sensor-label", "data_id": "outlet-water-temp-sensor-data", "sign_id": "outlet-water-temp-sensor-sign", "hide_label_field": "indoor_labels_visible", "hide_sign_field": "indoor_signs_visible", "device_class": "temperature"},
    "hp_hex_outlet_temp":   {"input_type": "entity", "device": "heat_pump_indoor", "label_key": "hp_hex_outlet_temp",   "group_id": "hex-outlet-water-temp-sensor", "label_id": "hex-outlet-water-temp-sensor-label", "data_id": "hex-outlet-water-temp-sensor-data", "sign_id": "hex-outlet-water-temp-sensor-sign", "hide_label_field": "indoor_labels_visible", "hide_sign_field": "indoor_signs_visible", "device_class": "temperature"},
    "hp_indoor_ref_temp":   {"input_type": "entity", "device": "heat_pump_indoor", "label_key": "hp_indoor_ref_temp",   "group_id": "indoor-refignant-temp-sensor", "label_id": "indoor-refignant-temp-sensor-label", "data_id": "indoor-refignant-temp-sensor-data", "sign_id": "indoor-refignant-temp-sensor-sign", "hide_label_field": "indoor_labels_visible", "hide_sign_field": "indoor_signs_visible", "device_class": "temperature"},
    "hp_3way_valve":        {"input_type": "entity", "device": "heat_pump_indoor", "label_key": "hp_3way_valve",        "group_id": "3-way-valve-direction", "label_id": "3-way-valve-direction-label", "data_id": "3-way-valve-direction-data", "sign_id": "3-way-valve-direction-sign", "hide_label_field": "indoor_labels_visible", "hide_sign_field": "indoor_signs_visible", "device_class": None},
    
    # --- Indoor: Animacje ---
    "hp_pump_speed": {"input_type": "entity", "device": "heat_pump_indoor", "label_key": "hp_pump_speed", "group_id": None, "label_id": None, "data_id": None, "sign_id": None, "device_class": "frequency"},

    # ============================================================
    # STREFY
    # ============================================================
    "zone1_temp":        {"input_type": "entity", "device": "zone_1", "label_key": "zone1_temp",        "group_id": "Zone1", "label_id": "zone-1-temp-label", "data_id": "zone-1-temp-data", "sign_id": None, "hide_label_field": "zone_labels_visible", "hide_sign_field": None, "device_class": "temperature"},
    "zone1_target_temp": {"input_type": "entity", "device": "zone_1", "label_key": "zone1_target_temp", "group_id": "Zone1", "label_id": "zone-1-target-temp-label", "data_id": "zone-1-target-temp-data", "sign_id": None, "hide_label_field": "zone_labels_visible", "hide_sign_field": None, "device_class": "temperature"},
    "zone2_temp":        {"input_type": "entity", "device": "zone_2", "label_key": "zone2_temp",        "group_id": "Zone2", "label_id": "zone-2-temp-label", "data_id": "zone-2-temp-data", "sign_id": None, "hide_label_field": "zone_labels_visible", "hide_sign_field": None, "device_class": "temperature"},
    "zone2_target_temp": {"input_type": "entity", "device": "zone_2", "label_key": "zone2_target_temp", "group_id": "Zone2", "label_id": "zone-2-target-temp-label", "data_id": "zone-21-target-temp-data", "sign_id": None, "hide_label_field": "zone_labels_visible", "hide_sign_field": None, "device_class": "temperature"},

    # ============================================================
    # CWU (DHW)
    # ============================================================
    "dhw_labels_visible": {"input_type": "boolean", "device": "dhw", "label_key": "dhw_labels_visible", "default": True},
    "dhw_signs_visible":  {"input_type": "boolean", "device": "dhw", "label_key": "dhw_signs_visible",  "default": True},
    "dhw_temp":           {"input_type": "entity",  "device": "dhw", "label_key": "dhw_temp", "group_id": "DHW", "label_id": None, "data_id": "text  dhw-data", "sign_id": None, "hide_label_field": None, "hide_sign_field": None, "device_class": "temperature"},

    # ============================================================
    # POGODA
    # ============================================================
    "weather_labels_visible": {"input_type": "boolean", "device": "weather", "label_key": "weather_labels_visible", "default": True},
    "weather_signs_visible":  {"input_type": "boolean", "device": "weather", "label_key": "weather_signs_visible",  "default": True},
    "weather_rain":           {"input_type": "entity", "device": "weather", "label_key": "weather_rain",           "group_id": "weather-rain", "label_id": "weather-rain-label", "data_id": "weather-rain-data", "sign_id": None, "hide_label_field": "weather_labels_visible", "hide_sign_field": None, "device_class": "precipitation"},
    "weather_pressure":       {"input_type": "entity", "device": "weather", "label_key": "weather_pressure",       "group_id": "weather-pressure", "label_id": "weather-pressure-label", "data_id": "weather-pressure-data", "sign_id": None, "hide_label_field": "weather_labels_visible", "hide_sign_field": None, "device_class": "pressure"},
    "weather_wind_direction": {"input_type": "entity", "device": "weather", "label_key": "weather_wind_direction", "group_id": "weather-wind-direction", "label_id": "weather-wind-direction-label", "data_id": "weather-wind-direction-data", "sign_id": None, "hide_label_field": "weather_labels_visible", "hide_sign_field": None, "device_class": None},
    "weather_wind_speed":     {"input_type": "entity", "device": "weather", "label_key": "weather_wind_speed",     "group_id": "weather-wind-speed", "label_id": "weather-wind-speed-label", "data_id": "weather-wind-speed-data", "sign_id": None, "hide_label_field": "weather_labels_visible", "hide_sign_field": None, "device_class": "wind_speed"},
    "weather_humidity":       {"input_type": "entity", "device": "weather", "label_key": "weather_humidity",       "group_id": "weather-humidity", "label_id": "weather-humidity-label", "data_id": "weather-humidity-data", "sign_id": None, "hide_label_field": "weather_labels_visible", "hide_sign_field": None, "device_class": "humidity"},
    "weather_sunrise": {"input_type": "entity", "device": "weather", "label_key": "weather_sunrise", "group_id": "weather-sunrise", "label_id": "weather-sunrise-label", "data_id": "weather-sunrise-data", "sign_id": None, "hide_label_field": "weather_labels_visible", "hide_sign_field": None, "device_class": "timestamp"},
    "weather_sunset":  {"input_type": "entity", "device": "weather", "label_key": "weather_sunset",  "group_id": "weather-sunset",  "label_id": "weather-sunset-label",  "data_id": "weather-sunset-data",  "sign_id": None, "hide_label_field": "weather_labels_visible", "hide_sign_field": None, "device_class": "timestamp"},
    # --- Weather: animacja (NOWE) ---
    "weather_condition":            {"input_type": "entity",  "device": "weather", "label_key": "weather_condition",            "group_id": None, "label_id": None, "data_id": None, "sign_id": None, "hide_label_field": None, "hide_sign_field": None, "device_class": None},
    #"weather_precipitation_rate":   {"input_type": "entity",  "device": "weather", "label_key": "weather_precipitation_rate",   "group_id": None, "label_id": None, "data_id": None, "sign_id": None, "hide_label_field": None, "hide_sign_field": None, "device_class": "precipitation_intensity"},
    "weather_animation_enabled":           {"input_type": "boolean", "device": "weather", "label_key": "weather_animation_enabled",           "default": True},
    "weather_precipitation_enabled":       {"input_type": "boolean", "device": "weather", "label_key": "weather_precipitation_enabled",       "default": True},
    "weather_daynight_background_enabled": {"input_type": "boolean", "device": "weather", "label_key": "weather_daynight_background_enabled", "default": True},
}