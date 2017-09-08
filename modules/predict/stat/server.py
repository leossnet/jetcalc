from flask import Flask, request
from flask import send_file
from flask_restful import Resource, Api
from flask import Flask, jsonify

import predict

dataset = predict.dataset_orig

app = Flask(__name__)
api = Api(app)


# noinspection PyMethodMayBeStatic
class Prediction(Resource):
    def get(self, future='3'):
        data = predict.predict(int(future))
        data = data.astype(int)
        result = data.tolist()
        return result

    def post(self,  future='3'):
        if not request.json:
            abort(400)
        global dataset
        dataset = request.json
        print(dataset)
        data = predict.predict(dataset=dataset, future=int(future))
        data = data.astype(int)
        result = data.tolist()
        return result


# noinspection PyMethodMayBeStatic
class PredictionDefault(Resource):
    def get(self):
        data = predict.predict()
        data = data.astype(int)
        result = data.tolist()
        return result

    def post(self):
        if not request.json:
            abort(400)
        global dataset
        dataset = request.json
        data = predict.predict(dataset=dataset)
        data = data.astype(int)
        result = data.tolist()
        return result


# noinspection PyMethodMayBeStatic
class DataBase(Resource):
    def get(self):
        result = dataset
        return result


@app.route('/graph')
def get_image():
    if request.args.get('f') is None:
        predict.predict(dataset=dataset)
    else:
        future = request.args.get('f')
        predict.predict(dataset=dataset, future=int(future))
    filename = 'results.png'
    return send_file(filename, mimetype='image/png')


api.add_resource(PredictionDefault, '/prediction')  # Route_1
api.add_resource(Prediction, '/prediction/<future>')  # Route_2
api.add_resource(DataBase, '/database')  # Route_3

if __name__ == '__main__':
    app.run(port='5002')
