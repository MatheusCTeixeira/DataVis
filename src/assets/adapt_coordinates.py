import json
from shapely.geometry import shape, Point

def main():
    states = {}
    with open("data.json") as f:
        brazil = json.load(f)
        for state in brazil["features"]:
            state_name = state["properties"]["NAME_1"]
            state_geometry = shape(state["geometry"])
            states[state_name] = state_geometry

    fav_users = json.load(open("fav_users.json"))
    con_users = json.load(open("con_users.json"))
    bots = json.load(open("bots.json"))
    deleted = json.load(open("deleted.json"))
    suspended = json.load(open("suspended.json"))

    selected = list(fav_users)
    selected.extend(list(con_users))
    selected.extend(list(con_users))
    selected.extend(list(bots))
    selected.extend(list(suspended))
    selected.extend(list(deleted))
    print(selected[:5])
    
    summarized = {i:{} for i in range(1, 37+1)}

    coords = json.load(open("coordinates.json"))
    for week, users in coords.items():
        print(week)
        for user, coordinates in users.items():
            #if int(user) not in selected:
                #continue
                
            for point in coordinates:
                point = Point(point["coordinates"])
                for state in states:
                    if state not in summarized[int(week)]:
                        summarized[int(week)][state] = 0
                        
                    if states[state].contains(point):
                        summarized[int(week)][state] += 1
                        #print(summarized)

    json.dump(summarized, open("summarized.json", "wt"))

if "__main__" == __name__:
    main()
