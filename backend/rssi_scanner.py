import subprocess
import re
import time

class RSSIScanner:
    def __init__(self):
        self.connected_ssid = self._get_connected_ssid()
        if not self.connected_ssid:
            print("Warning: Could not detect a connected WiFi network.")

    def _get_connected_ssid(self):
        """Finds the SSID of the currently connected network on Windows."""
        try:
            result = subprocess.run(
                ['netsh', 'wlan', 'show', 'interfaces'],
                capture_output=True, text=True, timeout=5
            )
            for line in result.stdout.split('\n'):
                if 'SSID' in line and 'BSSID' not in line:
                    parts = line.split(':')
                    if len(parts) > 1:
                        return parts[1].strip()
        except Exception as e:
            print(f"Error getting connected SSID: {e}")
        return None

    def get_current_rssi(self):
        """
        Polls the connected network's signal strength.
        Returns RSSI in dBm, or None if failed.
        """
        try:
            result = subprocess.run(
                ['netsh', 'wlan', 'show', 'interfaces'],
                capture_output=True, text=True, timeout=5
            )
            for line in result.stdout.split('\n'):
                if 'Signal' in line:
                    match = re.search(r'(\d+)\s*%', line)
                    if match:
                        signal_percent = int(match.group(1))
                        # Approximate conversion from Windows % to dBm
                        rssi_dbm = -100 + (signal_percent / 2)
                        return rssi_dbm
        except Exception as e:
            pass
        return None

    def scan_generator(self, interval=0.5):
        """Yields RSSI values at the given interval."""
        print(f"Scanning RSSI for '{self.connected_ssid}' every {interval}s...")
        while True:
            rssi = self.get_current_rssi()
            if rssi is not None:
                yield rssi
            time.sleep(interval)

if __name__ == "__main__":
    scanner = RSSIScanner()
    for rssi in scanner.scan_generator():
        print(f"Current RSSI: {rssi} dBm")
