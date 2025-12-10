# train.py
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from data import get_training_data
import pickle

# Carica dati
print("Caricamento dataset...")
texts, labels = get_training_data()
print(f"Samples: {len(texts)}, Intents: {len(set(labels))}")

# Encode labels
label_encoder = LabelEncoder()
labels_encoded = label_encoder.fit_transform(labels)
num_classes = len(label_encoder.classes_)

print(f"Classi: {label_encoder.classes_}")
print(f"Encoded: {labels_encoded[:5]}")

# Tokenization
max_words = 1000
max_len = 20

tokenizer = Tokenizer(num_words=max_words, oov_token="")
tokenizer.fit_on_texts(texts)
sequences = tokenizer.texts_to_sequences(texts)

print(f"Vocabulary size: {len(tokenizer.word_index)}")
print(f"Esempio sequenza: {sequences[0]}")

# Padding
padded_sequences = pad_sequences(
    sequences, 
    maxlen=max_len, 
    padding='post', 
    truncating='post'
)

print(f"Sequence length: {max_len}")
print(f"Shape: {padded_sequences.shape}")

# Split train/test (80/20)
X_train, X_test, y_train, y_test = train_test_split(
    padded_sequences, 
    labels_encoded, 
    test_size=0.2, 
    random_state=42
)

print(f"Train: {len(X_train)}, Test: {len(X_test)}")

# Costruisci modello
print("\nCostruzione modello...")
model = keras.Sequential([
    keras.layers.Embedding(input_dim=max_words, output_dim=64, input_length=max_len),
    keras.layers.LSTM(64, return_sequences=False),
    keras.layers.Dropout(0.5),
    keras.layers.Dense(32, activation='relu'),
    keras.layers.Dense(num_classes, activation='softmax')
])

model.summary()

# Compila modello
model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

# Training
print("\n=== INIZIO TRAINING ===")
history = model.fit(
    X_train, y_train,
    epochs=50,
    batch_size=8,
    validation_data=(X_test, y_test),
    verbose=1
)

# Valutazione
print("\n=== VALUTAZIONE ===")
test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
print(f"Test Accuracy: {test_acc:.2%}")
print(f"Test Loss: {test_loss:.4f}")

# Salva modello e artifacts
import os
os.makedirs('intent_model', exist_ok=True)
model.save('intent_model/model.keras')
with open('intent_model/tokenizer.pkl', 'wb') as f:
    pickle.dump(tokenizer, f)
with open('intent_model/label_encoder.pkl', 'wb') as f:
    pickle.dump(label_encoder, f)

print("\n✓ Modello salvato in ./intent_model")

