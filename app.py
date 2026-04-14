from flask import Flask, render_template, request, jsonify
from algorithms.pso import pso_tsp
from algorithms.genetic import genetic_tsp

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/run', methods=['POST'])
def run():
    data = request.get_json()
    cities = data['cities']
    algorithm = data['algorithm']
    iterations = int(data.get('iterations', 200))
    population = int(data.get('population', 30))

    if len(cities) < 3:
        return jsonify({'error': 'Please add at least 3 cities!'}), 400

    if algorithm == 'pso':
        best_route, best_score, history = pso_tsp(
            cities,
            num_particles=population,
            iterations=iterations
        )
    elif algorithm == 'genetic':
        best_route, best_score, history = genetic_tsp(
            cities,
            population_size=population,
            iterations=iterations,
            mutation_rate=0.1
        )
    else:
        return jsonify({'error': 'Unknown algorithm'}), 400

    return jsonify({
        'best_route': best_route,
        'best_score': round(best_score, 2),
        'history': history,
        'algorithm': algorithm
    })

@app.route('/compare', methods=['POST'])
def compare():
    data = request.get_json()
    cities = data['cities']
    iterations = int(data.get('iterations', 200))
    population = int(data.get('population', 30))

    if len(cities) < 3:
        return jsonify({'error': 'Please add at least 3 cities!'}), 400

    pso_route, pso_score, pso_history = pso_tsp(
        cities,
        num_particles=population,
        iterations=iterations
    )

    ga_route, ga_score, ga_history = genetic_tsp(
        cities,
        population_size=population,
        iterations=iterations,
        mutation_rate=0.1
    )

    return jsonify({
        'pso': {
            'best_route': pso_route,
            'best_score': round(pso_score, 2),
            'history': pso_history
        },
        'ga': {
            'best_route': ga_route,
            'best_score': round(ga_score, 2),
            'history': ga_history
        }
    })

if __name__ == '__main__':
    app.run(debug=True)