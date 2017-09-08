import numpy as np
import pickle
from statsmodels.tsa.api import VAR

dataset_orig = [[]]

def parse_args():
    import argparse
    parser = argparse.ArgumentParser()

    parser.add_argument(
        '--path', '-p',
        type=str,
        default='database.pickle',
        help='Path to input pickle.'
    )

    parser.add_argument(
        '--future', '-f',
        type=int,
        default=1,
        help='Number of steps to predict.'
    )

    return parser.parse_args()


# noinspection PyUnresolvedReferences
def predict(dataset=dataset_orig, future=1):
    args = parse_args()
    f = open(args.path, 'rb')
    dataset = pickle.load(f)
    future = args.future

    data = np.zeros((len(dataset), 4))
    data[:] = dataset

    for step in range(future):
        data_st2 = np.zeros((len(data), 4))
        data_st = np.log(data)

        data_st2[0] = data_st[0]
        data_st2[1:] = np.diff(data_st, axis=0)

        model = VAR(data_st2)
        results = model.fit()
        #print(results.summary())
        prediction_st2 = results.forecast(data_st2, 1)
        prediction_st = np.zeros((2, 4))
        prediction_st[0] = data_st[-1]
        prediction_st[1:] = prediction_st2
        prediction = np.cumsum(prediction_st, axis=0)[1:]
        prediction = np.exp(prediction)

        data = np.append(data, prediction, 0)

    print(data[-future:])
    return data[-future:]


if __name__ == '__main__':
    predict()
