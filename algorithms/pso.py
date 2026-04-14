import numpy as np
import random

import math

def calculate_distance(route, cities):
    total = 0
    n = len(route)
    for i in range(n):
        a = cities[route[i]]
        b = cities[route[(i + 1) % n]]
        # Haversine formula for real km distance
        lat1, lon1 = math.radians(a[0]), math.radians(a[1])
        lat2, lon2 = math.radians(b[0]), math.radians(b[1])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        h = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2
        total += 6371 * 2 * math.asin(math.sqrt(h))
    return total

def pso_tsp(cities, num_particles=30, iterations=200):
    n = len(cities)
    cities = [tuple(c) for c in cities]

    # Initialize particles (each particle = a random route)
    particles = [random.sample(range(n), n) for _ in range(num_particles)]
    personal_best = particles[:]
    personal_best_scores = [calculate_distance(p, cities) for p in particles]

    global_best = personal_best[personal_best_scores.index(min(personal_best_scores))]
    global_best_score = min(personal_best_scores)

    history = [global_best_score]

    for iteration in range(iterations):
        for i in range(num_particles):
            route = particles[i][:]

            # Move toward personal best (swap mutation)
            if random.random() < 0.5:
                a, b = random.sample(range(n), 2)
                route[a], route[b] = route[b], route[a]

            # Move toward global best (swap mutation)
            if random.random() < 0.5:
                for j in range(n):
                    if route[j] != global_best[j]:
                        k = route.index(global_best[j])
                        route[j], route[k] = route[k], route[j]
                        break

            score = calculate_distance(route, cities)
            particles[i] = route

            if score < personal_best_scores[i]:
                personal_best[i] = route[:]
                personal_best_scores[i] = score

            if score < global_best_score:
                global_best = route[:]
                global_best_score = score

        history.append(global_best_score)

    return global_best, global_best_score, history