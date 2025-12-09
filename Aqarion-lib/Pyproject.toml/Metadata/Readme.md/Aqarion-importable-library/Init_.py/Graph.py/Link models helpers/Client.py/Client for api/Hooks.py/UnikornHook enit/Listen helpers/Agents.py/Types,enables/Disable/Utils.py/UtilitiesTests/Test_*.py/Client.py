from typing import List
import requests
from .graph import Node, Link

class AqarionClient:
    def __init__(self, base_url: str = "http://localhost:8000/api/v1"):
        self.base_url = base_url.rstrip("/")

    def list_nodes(self) -> List[Node]:
        r = requests.get(f"{self.base_url}/graph/nodes/")
        r.raise_for_status()
        return [Node(**item) for item in r.json()]

    def list_links(self) -> List[Link]:
        r = requests.get(f"{self.base_url}/graph/links/")
        r.raise_for_status()
        return [Link(**item) for item in r.json()]
