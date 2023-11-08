import plotly.express as px
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.model_selection import cross_val_score
import numpy as np

def fit_regression(data, max_degree=5):
    """
    Fits a polynomial regression model to the given data up to a specified maximum degree.

    This function tries polynomial models of increasing degrees up to 'max_degree' and selects the best model based on cross-validation scores.
    The function prepares the input data for polynomial fitting, runs cross-validation on each model, and keeps track of the best-performing model.

    Args:
        data (np.ndarray): The 2D numpy array containing the data to fit the model to.
        max_degree (int, optional): The maximum degree of the polynomial model to be tested. Defaults to 5.

    Returns:
        tuple: A tuple containing the best-fitting model, the polynomial feature transformer, and the degree of the best polynomial.

    Note:
        - The function uses mean squared error as the scoring metric for cross-validation.
        - It prints the cross-validation score for each polynomial degree tried.
        - The function masks out any -1 values in the data, assuming they represent invalid or not possible combinations.
    """

    # prepare the data
    num_trips = np.arange(1, data.shape[0] + 1)
    num_stops = np.arange(1, data.shape[1] + 1)
    stops, trips = np.meshgrid(num_stops, num_trips)
    
    # flatten and mask to remove -1 values
    # (aka not possible combinations of stops and trips)
    flat_data = data.flatten()
    flat_stops = stops.flatten()
    flat_trips = trips.flatten()
    mask = flat_data != -1
    
    x = np.column_stack((flat_stops[mask], flat_trips[mask]))
    y = flat_data[mask]

    best_score = float('-inf')
    best_degree = 0
    best_model = None
    best_poly = None

    for degree in range(1, max_degree+1):
        poly = PolynomialFeatures(degree=degree)
        x_poly = poly.fit_transform(x)
        
        model = LinearRegression(fit_intercept=False)

        # use cross-validation to evaluate the model
        scores = cross_val_score(model, x_poly, y, cv=5, scoring='neg_mean_squared_error')
        avg_score = np.mean(scores)
        print(f"Score with degree {degree}: {avg_score}")

        if avg_score > best_score:
            best_score = avg_score
            best_degree = degree
            best_model = model.fit(x_poly, y)  # refit on the entire data
            best_poly = poly

    return best_model, best_poly, best_degree

def predict_value(model, poly, num_stops, num_trips):
    """
    Predicts a value using the best-fitting polynomial regression model.

    Given the number of stops and trips, this function uses the best-fitting model obtained from 'fit_regression' to make a prediction.

    Args:
        model (sklearn.linear_model._base.LinearRegression): The best-fitting polynomial regression model.
        poly (sklearn.preprocessing._data.PolynomialFeatures): The polynomial feature transformer used in the model.
        num_stops (int): The number of stops for the prediction.
        num_trips (int): The number of trips for the prediction.

    Returns:
        float: The predicted value from the model for the given number of stops and trips.

    Note:
        - The function transforms the input features into a polynomial feature set before making the prediction.
    """


    x_new = np.array([[num_stops, num_trips]])
    x_new_poly = poly.transform(x_new)
    return model.predict(x_new_poly)[0]

def main():
    """
    The main function to execute the polynomial regression fitting and prediction.

    This script loads the necessary data, fits a polynomial regression model, selects the best model, and then uses it for a prediction task. 
    It also includes printing of model details and the prediction result.

    Note:
        - The script includes setting up numpy print options for formatting.
        - It demonstrates the complete process from data loading, model fitting, to making a prediction.
        - Example values for 'num_stops' and 'num_trips' are used for demonstration, which can be replaced with actual values as needed.
    """
    np.set_printoptions(formatter={'float_kind': "{:.6f}".format})

    # load npy
    load_npy_path = f"./data/sensitivity_analyses/v1_0CVXPY.npy"
    data = np.load(load_npy_path, allow_pickle=True)

    # print(data)

    model, poly, degree = fit_regression(data)
    print(f"\nBest Polynomial Degree: {degree}")
    print(poly.get_feature_names_out())
    print(f"Model Coefficients: {model.coef_}")
    # print(f"Model Intercept: {model.intercept_}")

    num_stops_value = 42  # replace with desired value
    num_trips_value = 81  # replace with desired value

    predicted_value = predict_value(model, poly, num_stops_value, num_trips_value)
    print(f"\nPredicted value for {num_stops_value} stops and {num_trips_value} trips: {predicted_value}")

if __name__ == "__main__":
    main()
