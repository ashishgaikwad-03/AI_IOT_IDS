import pandas as pd
import joblib

train_df = pd.read_csv('C:/AI_IDS_IOT/data/bot_iot_10_best/train.csv', nrows=10)
X_train = train_df.iloc[:, :-1].select_dtypes(include=["int64", "float64"])
print("Columns kept:", X_train.columns.tolist())

try:
    model = joblib.load('C:/AI_IDS_IOT/models/bot_iot_xgb_multiclass.joblib')
    print("Model expected features:", model.feature_names_in_)
except Exception as e:
    print("Error loading model:", e)
