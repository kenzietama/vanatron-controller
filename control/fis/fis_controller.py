"""Fuzzy Inference System Controller for VFD based on Dissolved Oxygen"""
import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl
import logging

logger = logging.getLogger(__name__)

class FISController:
    def __init__(self, min_power: float = 30.0, max_power: float = 100.0):
        self.min_power = min_power
        self.max_power = max_power
        self._setup_fis()
    
    def _setup_fis(self):
        """Setup Fuzzy Inference System"""
        try:
            # Input/Output variables
            self.error = ctrl.Antecedent(np.arange(-1, 1.01, 0.01), 'error')
            self.d_error = ctrl.Antecedent(np.arange(-0.5, 0.51, 0.01), 'd_error')
            self.aerator_speed = ctrl.Consequent(np.arange(0, 100.01, 0.01), 'aerator_speed')
            
            # Membership functions for error
            self.error['Negatif Besar'] = fuzz.trapmf(self.error.universe, [-1, -1, -0.75, -0.5])
            self.error['Negatif Kecil'] = fuzz.trapmf(self.error.universe, [-0.75, -0.5, -0.25, 0])
            self.error['Nol'] = fuzz.trimf(self.error.universe, [-0.25, 0, 0.25])
            self.error['Positif Kecil'] = fuzz.trapmf(self.error.universe, [0, 0.25, 0.5, 0.75])
            self.error['Positif Besar'] = fuzz.trapmf(self.error.universe, [0.5, 0.75, 1, 1])
            
            # Membership functions for delta error
            self.d_error['Negatif'] = fuzz.trapmf(self.d_error.universe, [-0.5, -0.5, -0.25, 0])
            self.d_error['Stabil'] = fuzz.trimf(self.d_error.universe, [-0.25, 0, 0.25])
            self.d_error['Positif'] = fuzz.trapmf(self.d_error.universe, [0, 0.25, 0.5, 0.5])

            # Membership functions for aerator speed
            self.aerator_speed['Lambat'] = fuzz.trimf(self.aerator_speed.universe, [15, 30, 45])
            self.aerator_speed['Sedang'] = fuzz.trimf(self.aerator_speed.universe, [35, 50, 65])
            self.aerator_speed['Cepat'] = fuzz.trimf(self.aerator_speed.universe, [55, 70, 85])
            self.aerator_speed['Sangat_Cepat'] = fuzz.trimf(self.aerator_speed.universe, [75, 90, 100])
            self.aerator_speed['Max'] = fuzz.trimf(self.aerator_speed.universe, [90, 100, 100])
            
            # Defuzzification method
            self.aerator_speed.defuzzify_method = 'centroid'
            
            # Rules
            rules = [
                ctrl.Rule(self.error['Negatif Besar'] & self.d_error['Negatif'], self.aerator_speed['Lambat']),
                ctrl.Rule(self.error['Negatif Kecil'] & self.d_error['Negatif'], self.aerator_speed['Sedang']),
                ctrl.Rule(self.error['Nol'] & self.d_error['Negatif'], self.aerator_speed['Cepat']),
                ctrl.Rule(self.error['Positif Kecil'] & self.d_error['Negatif'], self.aerator_speed['Sangat_Cepat']),
                ctrl.Rule(self.error['Positif Besar'] & self.d_error['Negatif'], self.aerator_speed['Sangat_Cepat']),
                ctrl.Rule(self.error['Negatif Besar'] & self.d_error['Stabil'], self.aerator_speed['Lambat']),
                ctrl.Rule(self.error['Negatif Kecil'] & self.d_error['Stabil'], self.aerator_speed['Sedang']),
                ctrl.Rule(self.error['Nol'] & self.d_error['Stabil'], self.aerator_speed['Cepat']),
                ctrl.Rule(self.error['Positif Kecil'] & self.d_error['Stabil'], self.aerator_speed['Sangat_Cepat']),
                ctrl.Rule(self.error['Positif Besar'] & self.d_error['Stabil'], self.aerator_speed['Max']),
                ctrl.Rule(self.error['Negatif Besar'] & self.d_error['Positif'], self.aerator_speed['Lambat']),
                ctrl.Rule(self.error['Negatif Kecil'] & self.d_error['Positif'], self.aerator_speed['Sedang']),
                ctrl.Rule(self.error['Nol'] & self.d_error['Positif'], self.aerator_speed['Cepat']),
                ctrl.Rule(self.error['Positif Kecil'] & self.d_error['Positif'], self.aerator_speed['Sangat_Cepat']),
                ctrl.Rule(self.error['Positif Besar'] & self.d_error['Positif'], self.aerator_speed['Max'])
            ]
            
            # Create control system
            self.fis = ctrl.ControlSystem(rules)
            self.sim = ctrl.ControlSystemSimulation(self.fis)
            
            logger.info("FIS Controller initialized successfully")
        except Exception as e:
            logger.error(f"Error setting up FIS: {e}")
            raise
    
    def calculate_speed(self, error: float, delta_error: float) -> float:
        """Calculate VFD speed using FIS"""
        try:
            # Clamp inputs to valid ranges
            error = np.clip(error, -10, 10)
            delta_error = np.clip(delta_error, -5, 5)
            
            # Set inputs
            self.sim.input['error'] = error
            self.sim.input['d_error'] = delta_error
            
            # Compute
            self.sim.compute()
            
            # Get output and clamp to valid range
            speed = self.sim.output['aerator_speed']
            speed = np.clip(speed, self.min_power, self.max_power)
            
            logger.debug(f"FIS calculation - Error: {error:.2f}, dError: {delta_error:.2f}, Speed: {speed:.2f}%")
            return float(speed)
        except Exception as e:
            logger.error(f"Error in FIS calculation: {e}")
            # Return safe default speed
            return self.min_power