import asyncio
from dotenv import load_dotenv
import os
from spatial_constructor import AutonomousSpatialConstructor

load_dotenv(dotenv_path="../.env")

async def test():
    sc = AutonomousSpatialConstructor()
    result = await sc.generate_topology_async('TEST_PROJ', 'Roads', 20.0)
    print(result)

if __name__ == '__main__':
    asyncio.run(test())
