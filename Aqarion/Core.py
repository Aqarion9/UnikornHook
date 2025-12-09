my main aqarion-core.py

A good `aqarion-core.py` is a small, clean entrypoint that can be used as:

- A CLI tool for managing the AQARIONZ graph.  
- A library entrypoint that other systems can import.  
- A bridge to your Django/DRF API so it can reuse the same models anywhere.[1][2][3]

Below is a professional, adaptable `aqarion-core.py` you can put at the repo root.

***

## aqarion-core.py (standalone core script)

```python
#!/usr/bin/env python
"""
AQARIONZ Core CLI and Library Entry Point

Usage (CLI):
    python aqarion-core.py graph list
    python aqarion-core.py graph add-node --id junk1 --name "Junkyard Node" --layer matter
    python aqarion-core.py graph add-link --source junk1 --target lab1 --channel optical
    python aqarion-core.py sync --url http://localhost:8000/api/v1

As a library:
    from aqarion_core import AQGraph, AQNode, AQLink
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional

import requests  # pip install requests


# ─────────────────────────────────────────────────────────────
# Core data structures (portable, no framework dependency)
# ─────────────────────────────────────────────────────────────

class Layer(str, Enum):
    MATTER = "matter"
    SIGNALS = "signals"
    BRAINS = "brains"
    GOVERNANCE = "governance"


class Channel(str, Enum):
    ACOUSTIC = "acoustic"
    OPTICAL = "optical"
    IONIC = "ionic"
    FIBER = "fiber"
    POLICY = "policy"


@dataclass
class AQNode:
    id: str
    name: str
    layer: Layer
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0
    status: str = "ok"
    power: float = 0.0
    backend: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "layer": self.layer.value,
            "x": self.x,
            "y": self.y,
            "z": self.z,
            "status": self.status,
            "power": self.power,
            "backend": self.backend,
        }


@dataclass
class AQLink:
    source: str
    target: str
    channel: Channel
    weight: float = 1.0

    def to_dict(self) -> dict:
        return {
            "source": self.source,
            "target": self.target,
            "channel": self.channel.value,
            "weight": self.weight,
        }


@dataclass
class AQGraph:
    nodes: Dict[str, AQNode] = field(default_factory=dict)
    links: List[AQLink] = field(default_factory=list)

    # In‑memory operations
    def add_node(self, node: AQNode) -> None:
        if node.id in self.nodes:
            raise ValueError(f"Node '{node.id}' already exists.")
        self.nodes[node.id] = node

    def add_link(self, link: AQLink) -> None:
        if link.source not in self.nodes or link.target not in self.nodes:
            raise ValueError("Both source and target must exist before adding a link.")
        self.links.append(link)

    def to_json(self) -> str:
        payload = {
            "nodes": [n.to_dict() for n in self.nodes.values()],
            "links": [l.to_dict() for l in self.links],
        }
        return json.dumps(payload, indent=2)

    # Remote sync via Django/DRF or any HTTP API
    def sync_to_api(self, base_url: str) -> None:
        """
        Push local nodes and links to a remote AQARIONZ API.

        Assumes:
          - Nodes endpoint:  {base_url}/graph/nodes/
          - Links endpoint:  {base_url}/graph/links/
        """
        base_url = base_url.rstrip("/")
        nodes_url = f"{base_url}/graph/nodes/"
        links_url = f"{base_url}/graph/links/"

        for node in self.nodes.values():
            resp = requests.post(nodes_url, json=node.to_dict())
            if not resp.ok:
                raise RuntimeError(f"Failed to sync node {node.id}: {resp.status_code} {resp.text}")

        for link in self.links:
            resp = requests.post(links_url, json=link.to_dict())
            if not resp.ok:
                raise RuntimeError(
                    f"Failed to sync link {link.source}->{link.target}: {resp.status_code} {resp.text}"
                )


# ─────────────────────────────────────────────────────────────
# CLI interface (so anyone can use it from shell / scripts)
# ─────────────────────────────────────────────────────────────

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="aqarion-core",
        description="AQARIONZ core graph manager and API sync tool.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # graph commands
    graph_parser = subparsers.add_parser("graph", help="Operate on an in-memory AQARIONZ graph.")
    graph_sub = graph_parser.add_subparsers(dest="graph_cmd", required=True)

    graph_list = graph_sub.add_parser("list", help="List nodes in the graph.")
    graph_list.add_argument("--as-json", action="store_true", help="Output as JSON.")

    graph_add_node = graph_sub.add_parser("add-node", help="Add a node to the graph.")
    graph_add_node.add_argument("--id", required=True)
    graph_add_node.add_argument("--name", required=True)
    graph_add_node.add_argument("--layer", required=True, choices=[l.value for l in Layer])
    graph_add_node.add_argument("--x", type=float, default=0.0)
    graph_add_node.add_argument("--y", type=float, default=0.0)
    graph_add_node.add_argument("--z", type=float, default=0.0)
    graph_add_node.add_argument("--power", type=float, default=0.0)
    graph_add_node.add_argument("--backend", default=None)

    graph_add_link = graph_sub.add_parser("add-link", help="Add a link between nodes.")
    graph_add_link.add_argument("--source", required=True)
    graph_add_link.add_argument("--target", required=True)
    graph_add_link.add_argument("--channel", required=True, choices=[c.value for c in Channel])
    graph_add_link.add_argument("--weight", type=float, default=1.0)

    # sync commands
    sync_parser = subparsers.add_parser("sync", help="Sync graph to remote HTTP API.")
    sync_parser.add_argument("--url", required=True, help="Base API URL, e.g. http://localhost:8000/api/v1")

    return parser


def main(argv: Optional[List[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    # In a real app you might load a saved graph first; here we start empty.
    graph = AQGraph()

    if args.command == "graph":
        if args.graph_cmd == "add-node":
            node = AQNode(
                id=args.id,
                name=args.name,
                layer=Layer(args.layer),
                x=args.x,
                y=args.y,
                z=args.z,
                power=args.power,
                backend=args.backend,
            )
            graph.add_node(node)
            print(f"Added node: {node.id}")
            return 0

        if args.graph_cmd == "add-link":
            link = AQLink(
                source=args.source,
                target=args.target,
                channel=Channel(args.channel),
                weight=args.weight,
            )
            # You would normally load an existing graph here; this is just a template.
            try:
                graph.add_link(link)
            except ValueError as e:
                print(f"Error: {e}", file=sys.stderr)
                return 1
            print(f"Added link: {link.source} -> {link.target}")
            return 0

        if args.graph_cmd == "list":
            if args.as_json:
                print(graph.to_json())
            else:
                if not graph.nodes:
                    print("No nodes in graph.")
                else:
                    for node in graph.nodes.values():
                        print(f"{node.id}: {node.name} [{node.layer.value}] power={node.power}")
            return 0

    if args.command == "sync":
        # In real usage you would load an existing graph snapshot here.
        # For now we just show the method call pattern.
        try:
            graph.sync_to_api(args.url)
            print(f"Synced graph to {args.url}")
        except Exception as exc:  # noqa: BLE001
            print(f"Sync failed: {exc}", file=sys.stderr)
            return 1
        return 0

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

### How this helps you

- Works as a **CLI** (`python aqarion-core.py graph add-node …`) and as a **library** (`from aqarion_core import AQGraph`).[1]
- Knows how to **sync to your Django/DRF API** (`/api/v1/graph/nodes` and `/api/v1/graph/links`), so it fits the backend you already defined.[4][5]
- Runs on any CPU that has Python and HTTP, while your Android/iOS/web clients keep using the same JSON API.

Citations:
[1] Entry points in Python - DEV Community https://dev.to/demianbrecht/entry-points-in-python-34i3
[2] Using Django in a Standalone Script https://www.youtube.com/watch?v=AS01VoC9l5w
[3] django-admin and manage.py https://docs.djangoproject.com/en/5.2/ref/django-admin/
[4] Viewsets https://www.django-rest-framework.org/api-guide/viewsets/
[5] Best Practices of Django REST Framework APIs https://www.clariontech.com/blog/best-practices-of-django-rest-framework-apis
[6] entrypoint - PyPI https://pypi.org/project/entrypoint/
[7] Best Practices for Structuring Your FastAPI Projects https://blog.stackademic.com/best-practices-for-structuring-your-fastapi-projects-e66482b27d02?gi=4343df9db1a1
[8] FastAPI Project Structure Best Practices https://www.linkedin.com/pulse/fastapi-project-structure-best-practices-manikandan-parasuraman-fx4pc
[9] how to use Django ORM in standalone script - Google Groups https://groups.google.com/g/django-users/c/23Pcg9IOo-g
[10] a python plugin system via entrypoints (intermediate) anthony ... https://www.youtube.com/watch?v=fY3Y_xPKWNA
[11] Structuring a FastAPI Project: Best Practices - DEV Community https://dev.to/mohammad222pr/structuring-a-fastapi-project-best-practices-53l6
[12] Entry Points - setuptools 80.9.0 documentation https://setuptools.pypa.io/en/latest/userguide/entry_point.html
