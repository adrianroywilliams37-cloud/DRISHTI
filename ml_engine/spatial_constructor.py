import hashlib
import random
from typing import Dict, Any
import os
import json
import asyncio
from google import genai
from google.genai import types

# Load cache
CACHE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "spatial_cache.json")

def load_cache():
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r") as f:
            return json.load(f)
    return {}

def save_cache(cache_data):
    with open(CACHE_FILE, "w") as f:
        json.dump(cache_data, f, indent=2)

class AutonomousSpatialConstructor:
    """
    Simulates a highly advanced NeRF/Photogrammetry pipeline for ALL DRISHTI sectors using Gemini API.
    """
    
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None

    async def generate_topology_async(self, project_id: str, sector: str, completion_pct: float = 0.0) -> Dict[str, Any]:
        cache = load_cache()
        if project_id in cache:
            # Add small delay to simulate network/db fetch
            await asyncio.sleep(0.5)
            topology = cache[project_id]
            # Update dynamic fields like telemetry
            topology["telemetry"] = self._get_base_telemetry(completion_pct, topology.get("components", []))
            return topology
            
        print(f"[AI Spatial] Cache miss for {project_id}. Initiating Generative AI construction...")
        
        # If no Gemini API Key, fallback to our simulated logic
        if not self.client:
            print("[AI Spatial] No Gemini API key. Using highly-tuned procedural fallback...")
            await asyncio.sleep(3.0) # Simulate AI generation delay
            topology = self._generate_procedural_topology(project_id, sector, completion_pct)
        else:
            topology = await self._generate_with_gemini(project_id, sector, completion_pct)
            
        # Cache the generated result
        cache[project_id] = topology
        save_cache(cache)
        
        return topology

    async def _generate_with_gemini(self, project_id: str, sector: str, completion_pct: float) -> Dict[str, Any]:
        print(f"[AI Spatial] Prompting Gemini for {sector} topology...")
        
        prompt = f"""
        You are a highly advanced NeRF/Photogrammetry simulation AI and autonomous 3D architectural builder for the DRISHTI system.
        Your task is to generate an EXTREMELY DETAILED, realistic digital scale model of an infrastructure project by breaking it down into a highly complex assembly of interlocking geometric primitives.
        Project ID: {project_id}
        Sector: {sector}
        
        CRITICAL: Do NOT generate a simple structure. You MUST generate between 20 to 50 distinct components to form a dense, intricately detailed, and realistic 3D hologram replica of real infrastructure (e.g., if it's a bridge, include suspender cables, towers, multiple deck segments, guardrails, and footings).
        
        You must output JSON exactly matching this schema:
        {{
            "project_id": "{project_id}",
            "sector": "{sector}",
            "architecture": "<specific style>",
            "metrics": {{"total_units": <int>, "total_length_m": <float>}},
            "components": [
                {{
                    "id": "<unique-id>",
                    "type": "<descriptive part name>",
                    "geometry": "<box | cylinder | sphere | cone | torus>",
                    "position": [<x_float>, <y_float>, <z_float>],
                    "rotation": [<x_rad>, <y_rad>, <z_rad>],
                    "dimensions": [<x_scale>, <y_scale>, <z_scale>],
                    "label": "<human readable name>",
                    "phase": "Pre-Construction",
                    "status": "pending",
                    "material": "<concrete | steel | asphalt | glass | warning>"
                }}
            ]
        }}
        
        Rules:
        - "geometry" MUST be one of: "box", "cylinder", "sphere", "cone", "torus".
        - "rotation" MUST be an array of 3 floats in radians (e.g., [1.57, 0, 0] for 90-degree rotation).
        - "dimensions" for cylinder/cone/sphere maps to scale parameters in the frontend. Ensure they are proportional.
        - "material" MUST be one of: "concrete", "steel", "asphalt", "glass", "warning".
        - Ensure components are logically assembled around the origin [0,0,0] to look like a realistic scale model.
        - Return ONLY the raw JSON string. Do NOT wrap in markdown or anything else.
        """
        
        # Async call to gemini
        loop = asyncio.get_event_loop()
        def _call_gemini():
            return self.client.models.generate_content(
                model='gemini-3.6-flash',
                contents=prompt,
            )
        try:
            response = await loop.run_in_executor(None, _call_gemini)
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:-3]
            elif text.startswith("```"):
                text = text[3:-3]
            topology = json.loads(text)
            topology["telemetry"] = self._get_base_telemetry(completion_pct, topology.get("components", []))
            return topology
        except Exception as e:
            print(f"[AI Spatial] Failed to generate or parse Gemini response: {e}. Falling back to procedural.")
            return self._generate_procedural_topology(project_id, sector, completion_pct)

    def _hash_to_seed(self, project_id: str) -> int:
        return int(hashlib.md5(project_id.encode('utf-8')).hexdigest(), 16)

    def _generate_procedural_topology(self, project_id: str, sector: str, completion_pct: float = 0.0) -> Dict[str, Any]:
        seed = self._hash_to_seed(project_id)
        random.seed(seed)
        
        sector_lower = sector.lower()
        
        if "road" in sector_lower or "highway" in sector_lower:
            return self._generate_road_topology(project_id, completion_pct)
        elif "rail" in sector_lower:
            return self._generate_railway_topology(project_id, completion_pct)
        elif "power" in sector_lower or "energy" in sector_lower:
            return self._generate_power_topology(project_id, completion_pct)
        elif "water" in sector_lower or "hydro" in sector_lower:
            return self._generate_water_topology(project_id, completion_pct)
        elif "urban" in sector_lower or "building" in sector_lower:
            return self._generate_urban_topology(project_id, completion_pct)
        else:
            return self._generate_road_topology(project_id, completion_pct)

    def _get_base_telemetry(self, completion_pct: float, components: list) -> Dict[str, Any]:
        flagged_component = None
        if completion_pct < 100 and random.random() > 0.5 and len(components) > 0:
            flagged_component = random.choice(components)["id"]

        return {
            "flagged_component": flagged_component,
            "ai_confidence": round(random.uniform(0.85, 0.99), 3),
            "last_scan_utc": "2026-09-14T10:00:00Z"
        }

    def _get_status_for_component(self, i: int, total: int, completion_pct: float) -> tuple:
        threshold = (i + 1) / total * 100
        if completion_pct >= threshold:
            return "Complete", "built"
        elif completion_pct >= (i / total * 100):
            return "Active Construction", "in_progress"
        else:
            return "Pre-Construction", "pending"

    def _generate_road_topology(self, project_id: str, completion_pct: float) -> Dict[str, Any]:
        bridge_type = random.choice(["cable-stayed", "arch", "beam", "suspension"])
        num_spans = random.randint(3, 7)
        span_length = random.uniform(5.0, 8.0)
        total_length = num_spans * span_length
        start_x = - (total_length / 2) + (span_length / 2)
        
        components = []
        for i in range(num_spans):
            pos_x = start_x + (i * span_length)
            phase, status = self._get_status_for_component(i, num_spans, completion_pct)
            components.append({
                "id": f"R-SPAN-{i+1}",
                "type": "span",
                "position": [round(pos_x, 2), 0, 0],
                "label": f"Span {i+1}-{i+2}",
                "phase": phase,
                "status": status,
                "material": "asphalt",
                "dimensions": [round(span_length, 2), 0.6, 4.0]
            })

        pylons = []
        if bridge_type in ["cable-stayed", "suspension"]:
            if num_spans >= 4:
                pylons.append({"position": [components[1]["position"][0], 0, 0], "height": random.uniform(8.0, 12.0)})
                pylons.append({"position": [components[-2]["position"][0], 0, 0], "height": random.uniform(8.0, 12.0)})
            else:
                pylons.append({"position": [0, 0, 0], "height": random.uniform(8.0, 12.0)})

        telemetry = self._get_base_telemetry(completion_pct, components)

        return {
            "project_id": project_id,
            "sector": "Roads",
            "architecture": bridge_type,
            "metrics": {"num_spans": num_spans, "total_length_m": round(total_length * 10, 2), "pylon_count": len(pylons)},
            "components": components,
            "pylons": pylons,
            "telemetry": telemetry
        }

    def _generate_railway_topology(self, project_id: str, completion_pct: float) -> Dict[str, Any]:
        arch_type = random.choice(["elevated-viaduct", "surface-track", "terminal-hub"])
        num_segments = random.randint(5, 10)
        segment_length = 4.0
        
        components = []
        for i in range(num_segments):
            pos_x = (- (num_segments * segment_length) / 2) + (segment_length / 2) + (i * segment_length)
            phase, status = self._get_status_for_component(i, num_segments, completion_pct)
            components.append({
                "id": f"RL-TRK-{i+1}",
                "type": "track_segment",
                "position": [round(pos_x, 2), 0, 0],
                "label": f"Track Section {i+1}",
                "phase": phase,
                "status": status,
                "material": "steel",
                "dimensions": [round(segment_length, 2), 0.2, 3.0]
            })
            
        structures = []
        if arch_type == "terminal-hub" or random.random() > 0.5:
            structures.append({
                "id": "RL-STN-1",
                "position": [0, 0, 0],
                "dimensions": [8.0, 4.0, 6.0],
                "type": "station"
            })

        return {
            "project_id": project_id,
            "sector": "Railways",
            "architecture": arch_type,
            "metrics": {"num_segments": num_segments, "stations": len(structures)},
            "components": components,
            "structures": structures,
            "telemetry": self._get_base_telemetry(completion_pct, components)
        }

    def _generate_power_topology(self, project_id: str, completion_pct: float) -> Dict[str, Any]:
        arch_type = random.choice(["solar-array", "nuclear-plant", "substation-grid"])
        components = []
        
        if arch_type == "solar-array":
            rows, cols = random.randint(3, 5), random.randint(4, 8)
            for r in range(rows):
                for c in range(cols):
                    idx = r * cols + c
                    phase, status = self._get_status_for_component(idx, rows * cols, completion_pct)
                    components.append({
                        "id": f"PWR-PNL-{idx}",
                        "type": "solar_panel",
                        "position": [round((c - cols/2)*2, 2), 0, round((r - rows/2)*2, 2)],
                        "label": f"Array Block {r}-{c}",
                        "phase": phase,
                        "status": status,
                        "material": "glass",
                        "dimensions": [1.8, 0.1, 1.8]
                    })
        else: # nuclear or thermal
            num_towers = random.randint(1, 3)
            for i in range(num_towers):
                phase, status = self._get_status_for_component(i, num_towers, completion_pct)
                components.append({
                    "id": f"PWR-TWR-{i}",
                    "type": "cooling_tower",
                    "position": [round((i - num_towers/2)*6, 2), 0, 0],
                    "label": f"Reactor Unit {i+1}",
                    "phase": phase,
                    "status": status,
                    "material": "concrete",
                    "dimensions": [4.0, 8.0, 4.0] # roughly radius, height
                })

        return {
            "project_id": project_id,
            "sector": "Power",
            "architecture": arch_type,
            "metrics": {"total_units": len(components)},
            "components": components,
            "telemetry": self._get_base_telemetry(completion_pct, components)
        }

    def _generate_water_topology(self, project_id: str, completion_pct: float) -> Dict[str, Any]:
        arch_type = random.choice(["hydro-dam", "treatment-plant"])
        components = []
        
        if arch_type == "hydro-dam":
            # Dam wall segments
            num_segments = random.randint(4, 8)
            for i in range(num_segments):
                phase, status = self._get_status_for_component(i, num_segments, completion_pct)
                components.append({
                    "id": f"WTR-DAM-{i}",
                    "type": "dam_wall",
                    "position": [round((i - num_segments/2)*3, 2), 0, 0],
                    "label": f"Spillway {i}",
                    "phase": phase,
                    "status": status,
                    "material": "concrete",
                    "dimensions": [3.0, 10.0, 4.0]
                })
        else:
            # Treatment basins
            num_basins = random.randint(4, 6)
            for i in range(num_basins):
                phase, status = self._get_status_for_component(i, num_basins, completion_pct)
                r, c = divmod(i, 2)
                components.append({
                    "id": f"WTR-BSN-{i}",
                    "type": "treatment_basin",
                    "position": [round((c - 1)*4, 2), 0, round((r - 1)*4, 2)],
                    "label": f"Clarifier {i}",
                    "phase": phase,
                    "status": status,
                    "material": "concrete",
                    "dimensions": [3.0, 1.0, 3.0] # Cylindrical or box basins
                })

        return {
            "project_id": project_id,
            "sector": "Water",
            "architecture": arch_type,
            "metrics": {"total_units": len(components)},
            "components": components,
            "telemetry": self._get_base_telemetry(completion_pct, components)
        }

    def _generate_urban_topology(self, project_id: str, completion_pct: float) -> Dict[str, Any]:
        arch_type = random.choice(["skyscraper-complex", "transit-hub"])
        components = []
        
        num_buildings = random.randint(2, 5)
        for i in range(num_buildings):
            height = random.uniform(8.0, 20.0)
            phase, status = self._get_status_for_component(i, num_buildings, completion_pct)
            components.append({
                "id": f"URB-TWR-{i}",
                "type": "building",
                "position": [round((i - num_buildings/2)*4, 2), 0, round(random.uniform(-2, 2), 2)],
                "label": f"Tower {i+1}",
                "phase": phase,
                "status": status,
                "material": "glass",
                "dimensions": [3.0, round(height, 2), 3.0]
            })

        return {
            "project_id": project_id,
            "sector": "Urban Infra",
            "architecture": arch_type,
            "metrics": {"total_buildings": len(components)},
            "components": components,
            "telemetry": self._get_base_telemetry(completion_pct, components)
        }
