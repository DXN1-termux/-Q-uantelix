#!/usr/bin/env python3
"""
[Q]uantelix — Port Checker
Scans ports and finds open ones for the server.
"""

import socket
import sys
import json


def check_port(host: str, port: int) -> bool:
    """Check if a port is available."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1)
        return s.connect_ex((host, port)) != 0


def find_open_port(host: str = "0.0.0.0", start: int = 3000, end: int = 8099) -> int:
    """Find the first available port in range."""
    for port in range(start, end + 1):
        if check_port(host, port):
            return port
    return -1


def scan_ports(host: str = "0.0.0.0", start: int = 3000, end: int = 8099) -> dict:
    """Scan a range of ports and return status."""
    results = {"open": [], "closed": [], "total": 0}
    for port in range(start, end + 1):
        results["total"] += 1
        if check_port(host, port):
            results["open"].append(port)
        else:
            results["closed"].append(port)
    return results


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--json":
        start = int(sys.argv[2]) if len(sys.argv) > 2 else 3000
        end = int(sys.argv[3]) if len(sys.argv) > 3 else 8099
        results = scan_ports(start=start, end=end)
        results["suggested_port"] = find_open_port(start=start, end=end)
        print(json.dumps(results))
    elif len(sys.argv) > 1 and sys.argv[1] == "--find":
        start = int(sys.argv[2]) if len(sys.argv) > 2 else 3000
        end = int(sys.argv[3]) if len(sys.argv) > 3 else 8099
        port = find_open_port(start=start, end=end)
        print(port if port != -1 else "NO_PORT_AVAILABLE")
    else:
        port = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
        available = check_port("0.0.0.0", port)
        print(f"Port {port}: {'AVAILABLE' if available else 'IN USE'}")
        if not available:
            suggested = find_open_port(start=port + 1)
            if suggested != -1:
                print(f"Suggested: {suggested}")


if __name__ == "__main__":
    main()
