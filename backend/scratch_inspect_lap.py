import httpx
import json

# Fetch lap 12 for Ocon #31 and Hulkenberg #27 from 2024 Austrian GP Race (session 9550)
print("Fetching lap 12 data...")
lap31 = httpx.get("https://api.openf1.org/v1/laps?session_key=9550&driver_number=31&lap_number=12").json()[0]
print("Lap 31 start:", lap31['date_start'], "duration:", lap31['lap_duration'])

start_t = lap31['date_start']
end_t = "2024-06-30T13:17:26.300000+00:00"

locs = httpx.get(f"https://api.openf1.org/v1/location?session_key=9550&driver_number=31&date>={start_t}&date<={end_t}").json()
car = httpx.get(f"https://api.openf1.org/v1/car_data?session_key=9550&driver_number=31&date>={start_t}&date<={end_t}").json()

print(f"Driver 31: {len(locs)} location points, {len(car)} car data points")
if locs:
    print("Loc sample:", locs[0])
    xs = [p['x'] for p in locs if p.get('x')]
    ys = [p['y'] for p in locs if p.get('y')]
    print(f"Car X range: [{min(xs)}, {max(xs)}], Y range: [{min(ys)}, {max(ys)}]")

if car:
    print("Car sample:", car[0])
    speeds = [p['speed'] for p in car if p.get('speed')]
    print(f"Speeds range: [{min(speeds)}, {max(speeds)}], Max RPM: {max([p['rpm'] for p in car])}")
