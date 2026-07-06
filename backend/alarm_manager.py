import platform
import time

class AlarmManager:
    def __init__(self):
        self.is_windows = platform.system() == "Windows"
        if self.is_windows:
            import winsound
            self.winsound = winsound

    def trigger_alarm(self, duration_ms=1000):
        """Plays an audible beep to wake up a sleepwalker."""
        print("!!! ALARM TRIGGERED - SLEEPWALKING DETECTED !!!")
        if self.is_windows:
            # Frequency 2000Hz, duration defined by argument
            self.winsound.Beep(2000, duration_ms)
        else:
            # Fallback for non-windows (just terminal bell)
            print('\a')
            time.sleep(duration_ms / 1000.0)
