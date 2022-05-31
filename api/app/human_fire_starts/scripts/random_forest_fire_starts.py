import os
import streamlit as st
from os.path import dirname, realpath
from sklearn.ensemble import RandomForestRegressor
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
import pandas
import datetime
from dateutil.parser import parse


def parse_date(datestr: str):
    """ Extract relevant date details from input string,
        normalize to midnight, return date string YYYY/MM/DD
    """
    dt = parse(datestr, yearfirst=True)
    return dt.timestamp()


DATASET_FOLDER_PATH = os.path.join(dirname(realpath(dirname(__file__))), 'data')
ALL_FIRES_CSV_PATH = os.path.join(DATASET_FOLDER_PATH, 'FIRE_STARTS_PER_ZONE.csv')
HUMAN_FIRES_CSV_PATH = os.path.join(DATASET_FOLDER_PATH, 'HUMAN_FIRE_STARTS_PER_ZONE.csv')


with st.sidebar:
    dataset = st.radio(
        "Pick dataset",
        ('All Fires', 'Human Caused Fires'))
    date_range = st.date_input(
        "Select date range",
        value=[datetime.date(1950, 1, 1), datetime.date.today()]
    )

if dataset == "All Fires":
    df = pandas.read_csv(ALL_FIRES_CSV_PATH)
else:
    df = pandas.read_csv(HUMAN_FIRES_CSV_PATH)

st.title("Fire Starts by Human Activity")
st.dataframe(df)
st.caption("Input data")
st.header("Random Forest Results")
df = df.set_index('DATE_ISO')


def eval_model(input_df, output_label):
    X = input_df[['FIRE_CENTRE', 'ZONE', 'TIMESTAMP']]  # Features
    y = input_df['COUNT']  # Labels

    # Create regression model
    model = RandomForestRegressor(n_estimators=100, random_state=42)

    # Split data, 70% training and 30% test
    X_train, X_test, y_train, y_test = train_test_split(X.values, y, test_size=0.3)

    model.fit(X_train, y_train)

    score = model.score(X_train, y_train)

    ypred = model.predict(X_test)

    mse = mean_squared_error(y_test, ypred)

    # Plot
    st.subheader(output_label)
    st.write("R-squared: ", score, "MSE: ", mse, "RMSE: ", mse * (1 / 2.0))

    fig, ax = plt.subplots()
    x_ax = range(len(y_test))
    ax.plot(x_ax, y_test, linewidth=1, label="original")
    ax.plot(x_ax, ypred, linewidth=1.1, label="predicted")
    ax.legend(loc='best', fancybox=True, shadow=True)
    ax.set_ylabel("Fire starts")
    ax.grid(True)
    st.pyplot(fig)


try:
    start_date, end_date = date_range
    selected_range = df[(df.index >= start_date.isoformat()) & (df.index <= end_date.isoformat())]
    output_label = f'{start_date.isoformat()} to {end_date.isoformat()}'
    eval_model(selected_range, output_label)
except Exception:
    # do nothing
    pass

# last_2_years = df[(df.index > '2020-05-01') & (df.index <= '2022-05-1')]
# eval_model(last_2_years, "May 1, 2020 to May 1, 2022 (Last 2 years)")

# last_5_years = df[(df.index > '2017-05-01') & (df.index <= '2022-05-1')]
# eval_model(last_5_years, "May 1, 2017 to May 1, 2022 (Last 5 years)")

# last_decade = df[(df.index > '2012-05-01') & (df.index <= '2022-05-1')]
# eval_model(last_decade, "May 1, 2012 to May 1, 2022 (Last Decade)")

# last_two_decade = df[(df.index > '2002-05-01') & (df.index <= '2022-05-1')]
# eval_model(last_two_decade, "May 1, 2002 to May 1, 2022 (Last 2 decades)")

# last_three_decade = df[(df.index > '1992-05-01') & (df.index <= '2022-05-1')]
# eval_model(last_three_decade, "May 1, 1992 to May 1, 2022 (Last three decades)")
