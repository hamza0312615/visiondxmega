import numpy as np

class SleepAnalyzer:
    def __init__(self, window_size=40, sleepwalking_threshold=3.0, sample_rate=2.0):
        self.window_size = window_size
        self.sleepwalking_threshold = sleepwalking_threshold
        self.sample_rate = sample_rate
        self.history = []
        
        # Stats
        self.total_epochs = 0
        self.restless_epochs = 0
        self.sleepwalking_events = 0
        
        # For Bed Empty baseline
        self.initial_baseline = None

    def analyze_window(self, new_rssi):
        """
        Takes a new RSSI reading, updates the window, and returns the current state.
        States: "Bed Empty", "Deep Sleep", "Light Sleep", "Restless", "Sleepwalking!"
        """
        if self.initial_baseline is None:
            self.initial_baseline = new_rssi

        self.history.append(new_rssi)
        if len(self.history) > self.window_size:
            self.history.pop(0)
            
        if len(self.history) < self.window_size:
            return "Calibrating...", 0.0, 0
            
        # Calculate variance over the window
        variance = np.var(self.history)
        self.total_epochs += 1
        
        # Classification Logic
        state = "Deep Sleep"
        mean_rssi = np.mean(self.history)
        
        if variance > self.sleepwalking_threshold:
            state = "Sleepwalking!"
            self.sleepwalking_events += 1
        elif variance > (self.sleepwalking_threshold / 3):
            state = "Restless"
            self.restless_epochs += 1
        elif variance > (self.sleepwalking_threshold / 10):
            state = "Light Sleep"
        elif variance < 0.1 and abs(mean_rssi - self.initial_baseline) > 3.0:
            # Significant baseline shift with almost zero variance implies empty bed
            state = "Bed Empty"

        # Breathing rate extraction (FFT)
        bpm = 0
        # Breathing is only accurately detected when mostly still
        if state in ["Deep Sleep", "Light Sleep"]:
            detrended = np.array(self.history) - np.mean(self.history)
            fft_result = np.fft.rfft(detrended)
            freqs = np.fft.rfftfreq(len(detrended), d=1/self.sample_rate)
            
            # Human breathing range (0.1 Hz to 0.5 Hz) i.e. 6 to 30 BPM
            valid_idx = np.where((freqs >= 0.1) & (freqs <= 0.6))[0]
            if len(valid_idx) > 0:
                magnitudes = np.abs(fft_result[valid_idx])
                peak_idx = valid_idx[np.argmax(magnitudes)]
                peak_freq = freqs[peak_idx]
                bpm = int(peak_freq * 60)
            
        return state, variance, bpm

    def get_sleep_score(self):
        """Returns a daily sleep score out of 100 based on restlessness."""
        if self.total_epochs == 0:
            return 100
        
        penalty = (self.restless_epochs * 0.5) + (self.sleepwalking_events * 5.0)
        score = max(0, min(100, 100 - penalty))
        return score
