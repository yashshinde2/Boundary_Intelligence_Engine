import httpx

for sk, name in [(9540, "FP1"), (9545, "Sprint Qualifying"), (9549, "Sprint"), (9541, "Qualifying"), (9550, "Race")]:
    rc = httpx.get(f"https://api.openf1.org/v1/race_control?session_key={sk}").json()
    tls = [m['message'] for m in rc if 'TRACK LIMIT' in m.get('message', '').upper()]
    print(f"Session {name} ({sk}): {len(tls)} track limit incidents")
    for m in tls[:3]:
        print("  -", m)
