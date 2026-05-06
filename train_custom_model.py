import pandas as pd
import numpy as np
from xgboost import XGBClassifier
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

print("[*] Loading real network baseline...")

# 1. Load your actual hardware traffic
try:
    normal_data = pd.read_csv("real_normal_traffic.csv")
    print(f"[+] Loaded {len(normal_data)} rows of actual Normal traffic.")
except FileNotFoundError:
    print("[-] Error: real_normal_traffic.csv not found. Run the collector script first.")
    exit()

# 2. Generate Synthetic Attack Data (Mimicking a DoS/UDP Flood)
# We generate massive spikes in traffic that dwarf your normal baseline
print("[*] Generating synthetic DoS attack signatures...")
num_attack_samples = len(normal_data) # Keep the dataset balanced

attack_data = pd.DataFrame({
    'total_packets': np.random.randint(1500, 6000, num_attack_samples),
    'total_bytes': np.random.randint(1000000, 5000000, num_attack_samples),
    'packet_rate': np.random.uniform(750.0, 3000.0, num_attack_samples),
    'byte_rate': np.random.uniform(500000.0, 2500000.0, num_attack_samples),
    'label': 1  # Label 1 = Attack
})

# 3. Combine and Prepare for Training
df = pd.concat([normal_data, attack_data])
X = df[['total_packets', 'total_bytes', 'packet_rate', 'byte_rate']]
y = df['label']

# Split data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("[*] Training XGBoost Engine...")
model = XGBClassifier(n_estimators=100, learning_rate=0.1, max_depth=5, use_label_encoder=False, eval_metric='logloss')
model.fit(X_train, y_train)

# 4. Test the Model
predictions = model.predict(X_test)
print("\n--- MODEL PERFORMANCE ---")
print(f"Accuracy: {accuracy_score(y_test, predictions) * 100:.2f}%")
print(classification_report(y_test, predictions, target_names=["Normal", "Attack"]))

# 5. Save the Brain
joblib.dump(model, 'xgboost_custom_ids.pkl')
print("\n[+] Model successfully saved as 'xgboost_custom_ids.pkl'")