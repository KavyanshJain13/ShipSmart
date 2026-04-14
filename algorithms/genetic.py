import numpy as np
import random

import math

def calculate_distance(route, cities):
    total = 0
    n = len(route)
    for i in range(n):
        a = cities[route[i]]
        b = cities[route[(i + 1) % n]]
        lat1, lon1 = math.radians(a[0]), math.radians(a[1])
        lat2, lon2 = math.radians(b[0]), math.radians(b[1])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        h = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2
        total += 6371 * 2 * math.asin(math.sqrt(h))
    return total

def create_population(size, n):
    return [random.sample(range(n), n) for _ in range(size)]

def selection(population, cities):
    # Tournament selection
    a, b = random.sample(population, 2)
    return a if calculate_distance(a, cities) < calculate_distance(b, cities) else b

def crossover(parent1, parent2):
    # Order crossover (OX)
    n = len(parent1)
    start, end = sorted(random.sample(range(n), 2))
    child = [-1] * n
    child[start:end] = parent1[start:end]
    pointer = 0
    for gene in parent2:
        if gene not in child:
            while child[pointer] != -1:
                pointer += 1
            child[pointer] = gene
    return child

def mutate(route, rate=0.1):
    # Swap mutation
    if random.random() < rate:
        a, b = random.sample(range(len(route)), 2)
        route[a], route[b] = route[b], route[a]
    return route

def genetic_tsp(cities, population_size=30, iterations=200, mutation_rate=0.1):
    n = len(cities)
    cities = [tuple(c) for c in cities]

    population = create_population(population_size, n)
    scores = [calculate_distance(p, cities) for p in population]

    best = population[scores.index(min(scores))]
    best_score = min(scores)

    history = [best_score]

    for iteration in range(iterations):
        new_population = []

        for _ in range(population_size):
            parent1 = selection(population, cities)
            parent2 = selection(population, cities)
            child = crossover(parent1, parent2)
            child = mutate(child, mutation_rate)
            new_population.append(child)

        population = new_population
        scores = [calculate_distance(p, cities) for p in population]

        current_best = population[scores.index(min(scores))]
        current_best_score = min(scores)

        if current_best_score < best_score:
            best = current_best[:]
            best_score = current_best_score

        history.append(best_score)

    return best, best_score, history