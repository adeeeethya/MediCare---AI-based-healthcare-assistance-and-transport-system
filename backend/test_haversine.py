import sys
sys.path.append('c:\\MediCare\\backend')
import utils

print(utils.haversine(10.0, 76.0, 11.0, 77.0))
print(utils.haversine(10.0, 76.0, 10.1, 76.1))
